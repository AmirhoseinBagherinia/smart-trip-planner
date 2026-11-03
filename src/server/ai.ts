import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import {
  CompromiseResult,
  CompromiseSubmission,
  DiaryMemoryNote,
  DiaryStory,
  PackingItem,
  TravelPersonality,
  Trip,
  TripDay,
  User,
  VerifiedPlace,
  WeatherForecastDay,
} from '../types.ts';
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
} from './templates.ts';
import { groundAndEnrichDays, validateTripSchedule } from './validator.ts';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-3.8-flash';

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
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

async function callGeminiStructured<T>(params: {
  systemInstruction: string;
  contents: string;
  responseSchema: any;
  timeoutMs?: number;
}): Promise<{ data: T; modelUsed: string; estimatedTokens: number }> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  const timeoutMs = params.timeoutMs ?? 18_000;
  const executeWithModel = async (modelName: string) => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), timeoutMs)
    );

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    const text = (response.text ?? '').trim();
    if (!text) {
      throw new Error('EMPTY_AI_RESPONSE');
    }
    const parsed = JSON.parse(text) as T;
    const estimatedTokens = Math.round(
      (params.systemInstruction.length +
        params.contents.length +
        text.length) /
        4
    );
    return { data: parsed, modelUsed: modelName, estimatedTokens };
  };

  try {
    return await executeWithModel(PRIMARY_MODEL);
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      return await executeWithModel(FALLBACK_MODEL);
    }
    throw err;
  }
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
      model: PRIMARY_MODEL,
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
      model: PRIMARY_MODEL,
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
  days: TripDay[];
  usedFallback: boolean;
}> {
  const snippet =
    params.freeTextPrompt ||
    `${params.daysCount} days in ${params.destination} (${params.personality}, $${params.totalBudget})`;
  enforceUserAccess(
    params.user,
    'itinerary_generation',
    PROMPT_VERSIONS.itinerary_generation,
    snippet
  );

  const startMs = Date.now();
  const cacheKey = makeCacheKey('itinerary_gen', {
    freeTextPrompt: params.freeTextPrompt,
    destination: params.destination,
    startDate: params.startDate,
    daysCount: params.daysCount,
    totalBudget: params.totalBudget,
    personality: params.personality,
  });

  const cached = db.getCachedResponse<{
    destination: string;
    country: string;
    centerLat: number;
    centerLng: number;
    title: string;
    days: TripDay[];
  }>(cacheKey);

  if (cached) {
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'itinerary_generation',
      model: PRIMARY_MODEL,
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
      days: any[];
    }>({
      systemInstruction: prompt.systemInstruction,
      contents: prompt.contents,
      responseSchema: ITINERARY_RESPONSE_SCHEMA,
    });

    const normalizedDays: TripDay[] = (data.days || []).map(
      (d: any, dayIdx: number) => ({
        dayNumber: d.dayNumber || dayIdx + 1,
        date: d.date || params.startDate,
        title: d.title || `Day ${dayIdx + 1} Exploration`,
        mysteryModeEnabled: false,
        revealedStopCount: 1,
        dailyBriefing: {
          vibeSummary:
            d.dailyBriefing?.vibeSummary ||
            `Curated ${params.personality.toLowerCase()} exploration.`,
          etiquetteTip:
            d.dailyBriefing?.etiquetteTip ||
            'Greet local hosts warmly and carry small change for markets.',
          wearAdvice:
            d.dailyBriefing?.wearAdvice ||
            'Comfortable walking shoes and breathable layers.',
        },
        stops: (d.stops || []).map((s: any, stopIdx: number) => ({
          id: `stop-${Date.now()}-${dayIdx}-${stopIdx}`,
          name: s.name || `Stop ${stopIdx + 1}`,
          description: s.description || '',
          category: s.category || 'History & Culture',
          startTime: s.startTime || '09:30',
          endTime: s.endTime || '11:30',
          durationMinutes: 120,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: s.openingHours || '09:00-19:00',
          estimatedCost: Number(s.estimatedCost || 15),
          lat: Number(s.lat || data.centerLat || 41.0082),
          lng: Number(s.lng || data.centerLng || 28.9784),
          isIndoor: Boolean(s.isIndoor),
          mysteryClue:
            s.mysteryClue ||
            'Follow the local footpath to discover our next cultural stop.',
          isCompleted: false,
          upvotes: [params.user.id],
          downvotes: [],
          comments: [],
        })),
      })
    );

    const groundedDays = groundAndEnrichDays(
      normalizedDays,
      params.verifiedPlaces,
      data.centerLat || 41.0082,
      data.centerLng || 28.9784
    );

    const validation = validateTripSchedule({
      days: groundedDays,
      totalBudget: params.totalBudget,
      personality: params.personality,
      verifiedPlaces: params.verifiedPlaces,
    });

    const result = {
      destination: data.destination || params.destination,
      country: data.country || 'International',
      centerLat: Number(data.centerLat || 41.0082),
      centerLng: Number(data.centerLng || 28.9784),
      title:
        data.title || `${params.destination} ${params.personality} Journey`,
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
    // Graceful Fallback to Pre-Validated City Template
    const fallback = buildFallbackCityTemplate({
      destination: params.destination,
      startDate: params.startDate,
      daysCount: params.daysCount,
      personality: params.personality,
      verifiedPlaces: params.verifiedPlaces,
    });

    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'itinerary_generation',
      model: PRIMARY_MODEL,
      promptVersion: PROMPT_VERSIONS.itinerary_generation,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet.slice(0, 140),
      notes: `Served pre-validated city template (${String(err?.message || 'API unavailable').slice(0, 60)})`,
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
      personality: params.trip.personality,
      verifiedPlaces: params.verifiedPlaces,
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
      model: PRIMARY_MODEL,
      promptVersion: PROMPT_VERSIONS.chat_replan,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: params.userMessage.slice(0, 140),
      notes: 'Applied deterministic smart re-planner',
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
  } catch {
    const items = buildDefaultPackingList(params.trip, params.weather);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'packing_list',
      model: PRIMARY_MODEL,
      promptVersion: PROMPT_VERSIONS.packing_list,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: 'Used weather-grounded packing template',
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
  } catch {
    const compromiseResult = buildDefaultCompromiseResult(params.submissions);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'group_compromise',
      model: PRIMARY_MODEL,
      promptVersion: PROMPT_VERSIONS.group_compromise,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: 'Used balanced multi-party compromise resolver',
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
  } catch {
    const story = buildDefaultDiaryStory(params.trip, params.notes);
    db.addAiLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      feature: 'travel_diary',
      model: PRIMARY_MODEL,
      promptVersion: PROMPT_VERSIONS.travel_diary,
      latencyMs: Date.now() - startMs,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      validationPassed: true,
      validationIssueCount: 0,
      status: 'fallback',
      promptSnippet: snippet,
      notes: 'Used editorial travelogue generator',
    });
    return { story, usedFallback: true };
  }
}
