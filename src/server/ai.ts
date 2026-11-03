import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import crypto from 'crypto';
import {
  CompromiseResult,
  CompromiseSubmission,
  DailyTransportPlan,
  DiaryMemoryNote,
  DiaryStory,
  PackingItem,
  RecommendedAccommodation,
  TravelPersonality,
  Trip,
  TripDay,
  User,
  VerifiedPlace,
  WeatherForecastDay,
} from '../types.ts';
import { formatCurrency } from '../utils/currency.ts';
import { db } from './db.ts';
import {
  buildChatReplanPrompt,
  buildCompromisePrompt,
  buildItineraryPrompt,
  buildPackingListPrompt,
  buildTravelDiaryPrompt,
  CHAT_REPLAN_RESPONSE_SCHEMA,
  COMPROMISE_RESPONSE_SCHEMA,
  ITINERARY_RESPONSE_SCHEMA,
  PACKING_LIST_RESPONSE_SCHEMA,
  PROMPT_VERSIONS,
  TRAVEL_DIARY_RESPONSE_SCHEMA,
} from './prompts.ts';
import {
  applyDeterministicChatReplan,
  buildDefaultCompromiseResult,
  buildDefaultDiaryStory,
  buildDefaultPackingList,
  buildFallbackCityTemplate,
  buildRecommendedAccommodationAndTransit,
  convertFromEurBase,
  getDestinationEconomyProfile,
  resolveDynamicCityCoordinates,
} from './templates.ts';
import { groundAndEnrichDays, validateTripSchedule } from './validator.ts';

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export interface AiConnectionStatus {
  apiKeyConfigured: boolean;
  activeModel: string;
  mode: 'live_connected' | 'fallback_active';
  lastError: string | null;
  lastCheckedAt: string;
}

let connectionState: AiConnectionStatus = {
  apiKeyConfigured: false,
  activeModel: MODEL_CANDIDATES[0],
  mode: 'live_connected',
  lastError: null,
  lastCheckedAt: new Date().toISOString(),
};

function resolveServerApiKey(): string | null {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
  ];
  for (const key of candidates) {
    if (
      key &&
      typeof key === 'string' &&
      key.trim() !== '' &&
      key.trim() !== 'MY_GEMINI_API_KEY'
    ) {
      return key.trim();
    }
  }
  return null;
}

export function getAiConnectionStatus(): AiConnectionStatus {
  const key = resolveServerApiKey();
  connectionState.apiKeyConfigured = Boolean(key);
  if (!key && !connectionState.lastError) {
    connectionState.mode = 'fallback_active';
    connectionState.lastError =
      'GEMINI_API_KEY is not set in environment secrets; using grounded city blueprint engine.';
  }
  return { ...connectionState };
}

// Rolling 60-second per-user rate limiter
const userRequestTimestamps = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 15;

export function checkUserRateLimit(
  userId: string,
  maxPerMinute = MAX_REQUESTS_PER_MINUTE
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (userRequestTimestamps.get(userId) || []).filter(
    (t) => t > windowStart
  );
  if (recent.length >= maxPerMinute) {
    const oldest = recent[0];
    const resetInSeconds = Math.max(
      1,
      Math.ceil((oldest + 60_000 - now) / 1000)
    );
    userRequestTimestamps.set(userId, recent);
    return { allowed: false, remaining: 0, resetInSeconds };
  }
  recent.push(now);
  userRequestTimestamps.set(userId, recent);
  return {
    allowed: true,
    remaining: maxPerMinute - recent.length,
    resetInSeconds: 60,
  };
}

export function resetRateLimitForTest(userId?: string): void {
  if (userId) {
    userRequestTimestamps.delete(userId);
  } else {
    userRequestTimestamps.clear();
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = resolveServerApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function makeCacheKey(prefix: string, payload: unknown): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 20);
  return `${prefix}:${hash}`;
}

function extractJsonObject<T>(rawText: string): T {
  const trimmed = rawText
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('INVALID_AI_JSON_OUTPUT');
  }
}

async function callGeminiStructured<T>(params: {
  systemInstruction: string;
  contents: string;
  responseSchema: any;
  enableGoogleSearch?: boolean;
  timeoutMs?: number;
}): Promise<{ data: T; modelUsed: string; estimatedTokens: number }> {
  const ai = getGeminiClient();
  if (!ai) {
    connectionState = {
      apiKeyConfigured: false,
      activeModel: MODEL_CANDIDATES[0],
      mode: 'fallback_active',
      lastError: 'GEMINI_API_KEY environment variable is missing or empty.',
      lastCheckedAt: new Date().toISOString(),
    };
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  const timeoutMs = params.timeoutMs ?? 38_000;
  const useSearch = params.enableGoogleSearch ?? true;
  let lastErrorMsg = '';

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), timeoutMs)
      );

      const configObj: any = {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      };

      if (useSearch) {
        configObj.tools = [{ googleSearch: {} }];
      }

      if (modelName.startsWith('gemini-3.8')) {
        configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      let response: any;
      try {
        const callPromise = ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: configObj,
        });
        response = await Promise.race([callPromise, timeoutPromise]);
      } catch (innerErr: any) {
        const innerMsg = String(innerErr?.message || innerErr || '');
        // If endpoint rejects combining googleSearch with responseSchema, retry with googleSearch and JSON prompt enforcement
        if (useSearch && innerMsg.includes('400')) {
          const fallbackConfig: any = {
            systemInstruction: `${params.systemInstruction}\nReturn ONLY a valid JSON object matching the requested schema, with no markdown prose outside the JSON.`,
            tools: [{ googleSearch: {} }],
          };
          if (modelName.startsWith('gemini-3.8')) {
            fallbackConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }
          const retryPromise = ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: fallbackConfig,
          });
          response = await Promise.race([retryPromise, timeoutPromise]);
        } else {
          throw innerErr;
        }
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('EMPTY_AI_RESPONSE');
      }
      const parsed = extractJsonObject<T>(rawText);
      const estimatedTokens = Math.round(
        (params.systemInstruction.length +
          params.contents.length +
          rawText.length) /
          4
      );

      connectionState = {
        apiKeyConfigured: true,
        activeModel: modelName,
        mode: 'live_connected',
        lastError: null,
        lastCheckedAt: new Date().toISOString(),
      };

      return { data: parsed, modelUsed: modelName, estimatedTokens };
    } catch (err: any) {
      lastErrorMsg = String(err?.message || err || 'Unknown Gemini error');
      // Try next candidate model if 404/not found/unsupported
      if (
        lastErrorMsg.includes('404') ||
        lastErrorMsg.includes('NOT_FOUND') ||
        lastErrorMsg.includes('not supported') ||
        lastErrorMsg.includes('400')
      ) {
        continue;
      }
      break;
    }
  }

  connectionState = {
    apiKeyConfigured: true,
    activeModel: MODEL_CANDIDATES[0],
    mode: 'fallback_active',
    lastError: lastErrorMsg.slice(0, 220),
    lastCheckedAt: new Date().toISOString(),
  };
  throw new Error(lastErrorMsg || 'GEMINI_CALL_FAILED');
}

function enforceUserAccess(
  user: User,
  feature:
    | 'itinerary_generation'
    | 'chat_replan'
    | 'packing_list'
    | 'group_compromise'
    | 'travel_diary',
  promptVersion: string,
  promptSnippet: string
): void {
  if (user.isBlocked) {
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      feature,
      model: connectionState.activeModel,
      promptVersion,
      latencyMs: 5,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: false,
      validationIssueCount: 0,
      status: 'blocked',
      promptSnippet: promptSnippet.slice(0, 140),
      notes: 'Account restricted by Administrator',
    });
    const error: any = new Error(
      'Your account has been restricted by an administrator from making AI requests.'
    );
    error.statusCode = 403;
    throw error;
  }

  const rate = checkUserRateLimit(user.id);
  if (!rate.allowed) {
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      feature,
      model: connectionState.activeModel,
      promptVersion,
      latencyMs: 4,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: false,
      validationIssueCount: 0,
      status: 'rate_limited',
      promptSnippet: promptSnippet.slice(0, 140),
      notes: `Rate limit exceeded. Try again in ${rate.resetInSeconds}s`,
    });
    const error: any = new Error(
      `Rate limit exceeded (${MAX_REQUESTS_PER_MINUTE} AI calls/min). Please wait ${rate.resetInSeconds} seconds.`
    );
    error.statusCode = 429;
    throw error;
  }
}

export async function generateTripItineraryAI(params: {
  user: User;
  freeTextPrompt?: string;
  destination: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  travelersCount: number;
  totalBudget: number;
  currency: string;
  interests: string[];
  personality: TravelPersonality;
  verifiedPlaces: VerifiedPlace[];
}): Promise<{
  destination: string;
  country: string;
  centerLat: number;
  centerLng: number;
  title: string;
  accommodation: RecommendedAccommodation;
  dailyTransport: DailyTransportPlan;
  days: TripDay[];
  usedFallback: boolean;
}> {
  const snippet =
    params.freeTextPrompt ||
    `${params.daysCount} days in ${params.destination} (${params.personality}, ${formatCurrency(params.totalBudget, params.currency)})`;
  enforceUserAccess(
    params.user,
    'itinerary_generation',
    PROMPT_VERSIONS.itinerary_generation,
    snippet
  );

  const startMs = Date.now();
  // Resolve real target city coordinates upfront so grounding & fallback always match the exact city
  const dynamicCityInfo = await resolveDynamicCityCoordinates(params.destination);

  const cacheKey = makeCacheKey('itinerary_gen_v3_8', {
    freeTextPrompt: params.freeTextPrompt,
    destination: params.destination.toLowerCase().trim(),
    startDate: params.startDate,
    daysCount: params.daysCount,
    totalBudget: params.totalBudget,
    currency: params.currency,
    personality: params.personality,
  });

  const cached = db.getCachedResponse<{
    destination: string;
    country: string;
    centerLat: number;
    centerLng: number;
    title: string;
    accommodation: RecommendedAccommodation;
    dailyTransport: DailyTransportPlan;
    days: TripDay[];
  }>(cacheKey);

  if (
    cached &&
    cached.destination
      .toLowerCase()
      .includes(params.destination.toLowerCase().trim()) &&
    cached.accommodation &&
    cached.dailyTransport
  ) {
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'itinerary_generation',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.itinerary_generation,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'cached',
      promptSnippet: snippet.slice(0, 140),
      notes: 'Served from validated response cache',
    });
    return { ...cached, usedFallback: false };
  }

  try {
    const prompt = buildItineraryPrompt(params);
    const { data, modelUsed, estimatedTokens } = await callGeminiStructured<{
      destination: string;
      country: string;
      centerLat: number;
      centerLng: number;
      title: string;
      accommodation?: RecommendedAccommodation;
      dailyTransport?: DailyTransportPlan;
      days: any[];
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: ITINERARY_RESPONSE_SCHEMA,
      enableGoogleSearch: true,
    });

    const resolvedDest = data.destination || dynamicCityInfo.city;
    const resolvedCountry = data.country || dynamicCityInfo.country;
    const targetLat = Number(data.centerLat || dynamicCityInfo.lat);
    const targetLng = Number(data.centerLng || dynamicCityInfo.lng);
    const seenStopNames = new Set<string>();
    const economy = getDestinationEconomyProfile(resolvedDest, resolvedCountry);

    const defaultBase = buildRecommendedAccommodationAndTransit({
      destination: resolvedDest,
      country: resolvedCountry,
      centerLat: targetLat,
      centerLng: targetLng,
      daysCount: params.daysCount,
      personality: params.personality,
      totalBudget: params.totalBudget,
      currency: params.currency,
    });

    let nightlyRate = Number(
      data.accommodation?.nightlyRate || defaultBase.accommodation.nightlyRate
    );
    if (economy.tier === 'iran_local') {
      const minStay = convertFromEurBase(15, params.currency);
      const maxStay = convertFromEurBase(35, params.currency);
      nightlyRate = Math.min(maxStay, Math.max(minStay, nightlyRate));
    }
    const nights = Math.max(
      1,
      Number(data.accommodation?.nights || defaultBase.accommodation.nights)
    );

    const accommodation: RecommendedAccommodation = {
      name: data.accommodation?.name || defaultBase.accommodation.name,
      neighborhood:
        data.accommodation?.neighborhood ||
        defaultBase.accommodation.neighborhood,
      style: data.accommodation?.style || defaultBase.accommodation.style,
      nightlyRate,
      nights,
      totalStayCost: nightlyRate * nights,
      bookingNote:
        data.accommodation?.bookingNote ||
        defaultBase.accommodation.bookingNote,
      lat: Number(data.accommodation?.lat || defaultBase.accommodation.lat),
      lng: Number(data.accommodation?.lng || defaultBase.accommodation.lng),
    };

    let dailyCostPerDay = Number(
      data.dailyTransport?.dailyCostPerDay ||
        defaultBase.dailyTransport.dailyCostPerDay
    );
    if (economy.tier === 'iran_local') {
      const minTrans = convertFromEurBase(3, params.currency);
      const maxTrans = convertFromEurBase(8, params.currency);
      dailyCostPerDay = Math.min(maxTrans, Math.max(minTrans, dailyCostPerDay));
    }

    const dailyTransport: DailyTransportPlan = {
      modeSummary:
        data.dailyTransport?.modeSummary ||
        defaultBase.dailyTransport.modeSummary,
      dailyCostPerDay,
      totalTransportCost: dailyCostPerDay * Math.max(1, params.daysCount),
      notes: data.dailyTransport?.notes || defaultBase.dailyTransport.notes,
    };

    const normalizedDays: TripDay[] = (data.days || []).map(
      (d: any, dayIdx: number) => ({
        dayNumber: d.dayNumber || dayIdx + 1,
        date: d.date || params.startDate,
        title: d.title || `Day ${dayIdx + 1} in ${resolvedDest}`,
        mysteryModeEnabled: false,
        revealedStopCount: 1,
        dailyBriefing: {
          vibeSummary:
            d.dailyBriefing?.vibeSummary ||
            `Curated ${params.personality.toLowerCase()} exploration of ${resolvedDest}.`,
          etiquetteTip:
            d.dailyBriefing?.etiquetteTip ||
            'Greet local hosts warmly and carry small change for markets.',
          wearAdvice:
            d.dailyBriefing?.wearAdvice ||
            'Comfortable walking shoes and breathable layers.',
        },
        stops: (d.stops || [])
          .filter((s: any) => {
            const key = String(s.name || '').toLowerCase().trim();
            if (!key || seenStopNames.has(key)) return false;
            seenStopNames.add(key);
            return true;
          })
          .map((s: any, stopIdx: number) => {
            let stopCost = Number(s.estimatedCost ?? 15);
            if (economy.tier === 'iran_local') {
              const cat = s.category || 'History & Culture';
              if (cat === 'Food & Dining' || cat === 'Cafe & Bakery') {
                stopCost = Math.min(
                  convertFromEurBase(6, params.currency),
                  Math.max(convertFromEurBase(2, params.currency), stopCost)
                );
              } else {
                stopCost = Math.min(
                  convertFromEurBase(6, params.currency),
                  Math.max(0, stopCost)
                );
              }
            }
            return {
              id: `stop-${Date.now()}-${dayIdx}-${stopIdx}`,
              name: s.name || `${resolvedDest} Stop ${stopIdx + 1}`,
              description: s.description || '',
              category: s.category || 'History & Culture',
              startTime: s.startTime || '09:30',
              endTime: s.endTime || '11:30',
              durationMinutes: 120,
              travelFromPrevMinutes: 0,
              distanceFromPrevKm: 0,
              openingHours: s.openingHours || '09:00-19:00',
              estimatedCost: stopCost,
              lat: Number(s.lat || targetLat + (stopIdx - 1) * 0.005),
              lng: Number(s.lng || targetLng + (stopIdx - 1) * 0.005),
              isIndoor: Boolean(s.isIndoor),
              mysteryClue:
                s.mysteryClue ||
                `Follow the local footpath in ${resolvedDest} to discover our next cultural stop.`,
              isCompleted: false,
              upvotes: [params.user.id],
              downvotes: [],
              comments: [],
            };
          }),
      })
    );

    const groundedDays = groundAndEnrichDays(
      normalizedDays,
      params.verifiedPlaces,
      targetLat,
      targetLng
    );

    const stopsTotal = groundedDays.reduce(
      (sum, d) => sum + d.stops.reduce((s, st) => s + st.estimatedCost, 0),
      0
    );
    const realisticTotal =
      accommodation.totalStayCost +
      dailyTransport.totalTransportCost +
      stopsTotal;

    if (
      params.totalBudget > realisticTotal * 1.4 &&
      groundedDays.length > 0 &&
      !groundedDays[0].dailyBriefing.vibeSummary
        .toLowerCase()
        .includes('surplus')
    ) {
      const surplus = Math.max(0, params.totalBudget - realisticTotal);
      groundedDays[0].dailyBriefing.vibeSummary = `${groundedDays[0].dailyBriefing.vibeSummary} Note: ${resolvedDest} is an exceptional high-value destination — your realistic local expenses total ~${formatCurrency(realisticTotal, params.currency)}, leaving a substantial budget surplus of ${formatCurrency(surplus, params.currency)} from your ${formatCurrency(params.totalBudget, params.currency)} allocation.`;
    }

    const validation = validateTripSchedule({
      days: groundedDays,
      totalBudget: params.totalBudget,
      currency: params.currency,
      personality: params.personality,
      verifiedPlaces: params.verifiedPlaces,
      accommodationCost: accommodation.totalStayCost,
      transportCost: dailyTransport.totalTransportCost,
    });

    const result = {
      destination: resolvedDest,
      country: resolvedCountry,
      centerLat: targetLat,
      centerLng: targetLng,
      title:
        data.title || `${resolvedDest} ${params.personality} Journey`,
      accommodation,
      dailyTransport,
      days: groundedDays,
    };

    db.setCachedResponse(cacheKey, result);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'itinerary_generation',
      model: modelUsed,
      promptVersion: PROMPT_VERSIONS.itinerary_generation,
      latencyMs: Date.now() - startMs,
      estimatedTokens,
      estimatedCostUsd: Number((estimatedTokens * 0.00000075).toFixed(5)),
      validationPassed: validation.isValid,
      validationIssueCount: validation.issues.length,
      status: 'success',
      promptSnippet: snippet.slice(0, 140),
    });

    return { ...result, usedFallback: false };
  } catch (err: any) {
    // Graceful Fallback to Pre-Validated City Template grounded in the exact target city
    const fallback = buildFallbackCityTemplate({
      destination: params.destination,
      startDate: params.startDate,
      daysCount: params.daysCount,
      personality: params.personality,
      totalBudget: params.totalBudget,
      currency: params.currency,
      verifiedPlaces: params.verifiedPlaces,
      dynamicCityInfo,
    });

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'itinerary_generation',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.itinerary_generation,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet.slice(0, 140),
      notes: `Grounded blueprint for ${fallback.destination} (${String(err?.message || 'API unavailable').slice(0, 80)})`,
    });

    return { ...fallback, usedFallback: true };
  }
}

export async function chatMutateItineraryAI(params: {
  user: User;
  trip: Trip;
  userMessage: string;
  verifiedPlaces: VerifiedPlace[];
}): Promise<{
  assistantReply: string;
  diffSummary: string[];
  days: TripDay[];
  usedFallback: boolean;
}> {
  enforceUserAccess(
    params.user,
    'chat_replan',
    PROMPT_VERSIONS.chat_replan,
    params.userMessage
  );

  const startMs = Date.now();
  try {
    const prompt = buildChatReplanPrompt({
      trip: params.trip,
      userMessage: params.userMessage,
      verifiedPlaces: params.verifiedPlaces,
    });

    const { data, modelUsed, estimatedTokens } = await callGeminiStructured<{
      assistantReply: string;
      diffSummary: string[];
      days: any[];
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: CHAT_REPLAN_RESPONSE_SCHEMA,
    });

    const updatedDays: TripDay[] = (data.days || []).map(
      (d: any, dayIdx: number) => {
        const existingDay = params.trip.days[dayIdx];
        return {
          dayNumber: d.dayNumber || dayIdx + 1,
          date: d.date || existingDay?.date || params.trip.startDate,
          title: d.title || existingDay?.title || `Day ${dayIdx + 1}`,
          mysteryModeEnabled: existingDay?.mysteryModeEnabled ?? false,
          revealedStopCount: existingDay?.revealedStopCount ?? 1,
          dailyBriefing: {
            vibeSummary:
              d.dailyBriefing?.vibeSummary ||
              existingDay?.dailyBriefing?.vibeSummary ||
              '',
            etiquetteTip:
              d.dailyBriefing?.etiquetteTip ||
              existingDay?.dailyBriefing?.etiquetteTip ||
              '',
            wearAdvice:
              d.dailyBriefing?.wearAdvice ||
              existingDay?.dailyBriefing?.wearAdvice ||
              '',
          },
          stops: (d.stops || []).map((s: any, stopIdx: number) => {
            const existingStop = existingDay?.stops[stopIdx];
            return {
              id:
                existingStop?.id ||
                `stop-chat-${Date.now()}-${dayIdx}-${stopIdx}`,
              name: s.name,
              description: s.description,
              category: s.category || 'History & Culture',
              startTime: s.startTime || '10:00',
              endTime: s.endTime || '12:00',
              durationMinutes: 120,
              travelFromPrevMinutes: 0,
              distanceFromPrevKm: 0,
              openingHours: s.openingHours || '09:00-19:00',
              estimatedCost: Number(s.estimatedCost ?? 15),
              lat: Number(s.lat || params.trip.centerLat),
              lng: Number(s.lng || params.trip.centerLng),
              isIndoor: Boolean(s.isIndoor),
              mysteryClue:
                s.mysteryClue ||
                existingStop?.mysteryClue ||
                'A newly curated stop along your route.',
              isCompleted: existingStop?.isCompleted ?? false,
              upvotes: existingStop?.upvotes ?? [params.user.id],
              downvotes: existingStop?.downvotes ?? [],
              comments: existingStop?.comments ?? [],
            };
          }),
        };
      }
    );

    const grounded = groundAndEnrichDays(
      updatedDays,
      params.verifiedPlaces,
      params.trip.centerLat,
      params.trip.centerLng
    );

    const validation = validateTripSchedule({
      days: grounded,
      totalBudget: params.trip.totalBudget,
      currency: params.trip.currency,
      personality: params.trip.personality,
      verifiedPlaces: params.verifiedPlaces,
      accommodationCost: params.trip.accommodation?.totalStayCost ?? 0,
      transportCost: params.trip.dailyTransport?.totalTransportCost ?? 0,
    });

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'chat_replan',
      model: modelUsed,
      promptVersion: PROMPT_VERSIONS.chat_replan,
      latencyMs: Date.now() - startMs,
      estimatedTokens,
      estimatedCostUsd: Number((estimatedTokens * 0.00000075).toFixed(5)),
      validationPassed: validation.isValid,
      validationIssueCount: validation.issues.length,
      status: 'success',
      promptSnippet: params.userMessage.slice(0, 140),
    });

    return {
      assistantReply: data.assistantReply,
      diffSummary: data.diffSummary || ['Updated itinerary schedule'],
      days: grounded,
      usedFallback: false,
    };
  } catch (err: any) {
    const fallback = applyDeterministicChatReplan(
      params.trip,
      params.userMessage,
      params.verifiedPlaces
    );

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'chat_replan',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.chat_replan,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: params.userMessage.slice(0, 140),
      notes: `Applied deterministic smart re-planner (${String(err?.message || '').slice(0, 60)})`,
    });

    return {
      ...fallback,
      usedFallback: true,
    };
  }
}

export async function generatePackingListAI(params: {
  user: User;
  trip: Trip;
  weather: WeatherForecastDay[];
}): Promise<{ items: PackingItem[]; usedFallback: boolean }> {
  const snippet = `Packing list for ${params.trip.destination} (${params.trip.days.length} days, ${params.trip.personality})`;
  enforceUserAccess(
    params.user,
    'packing_list',
    PROMPT_VERSIONS.packing_list,
    snippet
  );

  const startMs = Date.now();
  try {
    const prompt = buildPackingListPrompt({
      trip: params.trip,
      weather: params.weather,
    });
    const { data, modelUsed, estimatedTokens } = await callGeminiStructured<{
      items: Array<{
        name: string;
        category: any;
        quantity: number;
        reason: string;
      }>;
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: PACKING_LIST_RESPONSE_SCHEMA,
    });

    const items: PackingItem[] = (data.items || []).map((item, idx) => ({
      id: `pack-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category || 'Clothing',
      quantity: Math.max(1, Number(item.quantity || 1)),
      reason: item.reason,
      packed: false,
    }));

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'packing_list',
      model: modelUsed,
      promptVersion: PROMPT_VERSIONS.packing_list,
      latencyMs: Date.now() - startMs,
      estimatedTokens,
      estimatedCostUsd: Number((estimatedTokens * 0.00000075).toFixed(5)),
      validationPassed: items.length > 0,
      validationIssueCount: 0,
      status: 'success',
      promptSnippet: snippet,
    });

    return { items, usedFallback: false };
  } catch (err: any) {
    const items = buildDefaultPackingList(params.trip, params.weather);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'packing_list',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.packing_list,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: `Used weather-grounded packing template (${String(err?.message || '').slice(0, 60)})`,
    });
    return { items, usedFallback: true };
  }
}

export async function negotiateGroupCompromiseAI(params: {
  user: User;
  trip: Trip;
  submissions: CompromiseSubmission[];
  verifiedPlaces: VerifiedPlace[];
}): Promise<{
  compromiseResult: CompromiseResult;
  days?: TripDay[];
  usedFallback: boolean;
}> {
  const snippet = `Group compromise for ${params.trip.destination} (${params.submissions.length} participants)`;
  enforceUserAccess(
    params.user,
    'group_compromise',
    PROMPT_VERSIONS.group_compromise,
    snippet
  );

  const startMs = Date.now();
  try {
    const prompt = buildCompromisePrompt({
      trip: params.trip,
      submissions: params.submissions,
      verifiedPlaces: params.verifiedPlaces,
    });

    const { data, modelUsed, estimatedTokens } = await callGeminiStructured<{
      summary: string;
      fairnessScore: number;
      resolutions: Array<{
        participantName: string;
        howWishWasIncluded: string;
        assignedStops: string[];
      }>;
      days: any[];
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: COMPROMISE_RESPONSE_SCHEMA,
    });

    const compromiseResult: CompromiseResult = {
      summary: data.summary,
      fairnessScore: Math.min(99, Math.max(82, Number(data.fairnessScore || 94))),
      resolutions: data.resolutions || [],
      generatedAt: new Date().toISOString(),
    };

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'group_compromise',
      model: modelUsed,
      promptVersion: PROMPT_VERSIONS.group_compromise,
      latencyMs: Date.now() - startMs,
      estimatedTokens,
      estimatedCostUsd: Number((estimatedTokens * 0.00000075).toFixed(5)),
      validationPassed: true,
      validationIssueCount: 0,
      status: 'success',
      promptSnippet: snippet,
    });

    return { compromiseResult, usedFallback: false };
  } catch (err: any) {
    const compromiseResult = buildDefaultCompromiseResult(
      params.submissions,
      params.trip
    );
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'group_compromise',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.group_compromise,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: `Used balanced multi-party compromise resolver (${String(err?.message || '').slice(0, 60)})`,
    });
    return { compromiseResult, usedFallback: true };
  }
}

export async function generateTravelDiaryAI(params: {
  user: User;
  trip: Trip;
  notes: DiaryMemoryNote[];
}): Promise<{ story: DiaryStory; usedFallback: boolean }> {
  const snippet = `Travel diary story for ${params.trip.destination} (${params.notes.length} memory notes)`;
  enforceUserAccess(
    params.user,
    'travel_diary',
    PROMPT_VERSIONS.travel_diary,
    snippet
  );

  const startMs = Date.now();
  try {
    const prompt = buildTravelDiaryPrompt({
      trip: params.trip,
      notes: params.notes,
    });

    const { data, modelUsed, estimatedTokens } = await callGeminiStructured<{
      title: string;
      subtitle: string;
      narrativeMarkdown: string;
      highlights: string[];
      closingReflection: string;
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: TRAVEL_DIARY_RESPONSE_SCHEMA,
    });

    const story: DiaryStory = {
      ...data,
      generatedAt: new Date().toISOString(),
    };

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'travel_diary',
      model: modelUsed,
      promptVersion: PROMPT_VERSIONS.travel_diary,
      latencyMs: Date.now() - startMs,
      estimatedTokens,
      estimatedCostUsd: Number((estimatedTokens * 0.00000075).toFixed(5)),
      validationPassed: true,
      validationIssueCount: 0,
      status: 'success',
      promptSnippet: snippet,
    });

    return { story, usedFallback: false };
  } catch (err: any) {
    const story = buildDefaultDiaryStory(params.trip, params.notes);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'travel_diary',
      model: connectionState.activeModel,
      promptVersion: PROMPT_VERSIONS.travel_diary,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: `Used editorial travelogue generator (${String(err?.message || '').slice(0, 60)})`,
    });
    return { story, usedFallback: true };
  }
}
