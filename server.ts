import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  chatMutateItineraryAI,
  generatePackingListAI,
  generateTravelDiaryAI,
  generateTripItineraryAI,
  getAiConnectionStatus,
  negotiateGroupCompromiseAI,
  optimizeTripBudgetAI,
} from './src/server/ai.ts';
import { db } from './src/server/db.ts';
import { PROMPT_VERSIONS } from './src/server/prompts.ts';
import {
  applyPersonalityProfileToDays,
  buildDefaultPackingList,
  buildDefaultWeatherForecast,
  buildRecommendedAccommodationAndTransit,
} from './src/server/templates.ts';
import {
  autoFixScheduleTimings,
  groundAndEnrichDays,
  validateTripSchedule,
} from './src/server/validator.ts';
import {
  TravelPersonality,
  Trip,
  User,
  UserRole,
  WeatherForecastDay,
} from './src/types.ts';

async function fetchRealWeatherForecast(
  lat: number,
  lng: number,
  startDate: string,
  daysCount: number
): Promise<WeatherForecastDay[]> {
  const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}:${daysCount}`;
  const cached = db.getCachedResponse<WeatherForecastDay[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=${Math.min(14, Math.max(3, daysCount))}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
    const data: any = await res.json();
    const daily = data.daily;
    if (!daily || !Array.isArray(daily.time)) {
      throw new Error('Invalid Open-Meteo format');
    }

    const codeToText = (code: number): string => {
      if (code === 0) return 'Clear skies & abundant sunshine';
      if (code <= 3) return 'Partly cloudy with mild breeze';
      if (code <= 48) return 'Morning mist clearing by afternoon';
      if (code <= 67) return 'Light coastal rain showers';
      if (code <= 77) return 'Cool crisp mountain air';
      return 'Scattered afternoon showers';
    };

    const baseDate = new Date(startDate || new Date().toISOString().split('T')[0]);
    const forecast: WeatherForecastDay[] = daily.time
      .slice(0, Math.max(1, daysCount))
      .map((_: string, i: number) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        return {
          date: d.toISOString().split('T')[0],
          tempMaxC: Math.round(daily.temperature_2m_max?.[i] ?? 19),
          tempMinC: Math.round(daily.temperature_2m_min?.[i] ?? 12),
          precipitationProbability: Math.round(
            daily.precipitation_probability_max?.[i] ?? 15
          ),
          conditionSummary: codeToText(Number(daily.weathercode?.[i] ?? 1)),
        };
      });

    db.setCachedResponse(cacheKey, forecast);
    return forecast;
  } catch {
    return buildDefaultWeatherForecast(startDate).slice(0, Math.max(1, daysCount));
  }
}

function resolveUser(req: express.Request): User {
  const userId =
    (req.headers['x-user-id'] as string) ||
    (req.body?.userId as string) ||
    'user-traveler-1';
  return db.getUserById(userId) || db.getUsers()[0];
}

export async function createAppServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // 1. Bootstrap full state
  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      users: db.getUsers(),
      trips: db.getTrips(),
      verifiedPlaces: db.getVerifiedPlaces(),
      aiLogs: db.getAiLogs(),
      aiStatus: getAiConnectionStatus(),
    });
  });

  // 2. Auth: Sign In / Sign Up
  app.post('/api/auth/register', (req, res) => {
    const { name, email, role } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const existing = db.getUserByEmail(email.trim());
    if (existing) {
      return res.json({ user: existing, isNew: false });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Please provide your full name (at least 2 characters).' });
    }
    const validRoles: UserRole[] = ['traveler', 'buddy', 'admin'];
    const assignedRole: UserRole = validRoles.includes(role) ? role : 'traveler';
    const initials = name
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2);

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      avatarInitials: initials || 'TR',
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    return res.status(201).json({ user: newUser, isNew: true });
  });

  // 3. UC1 & UC2: Create a Trip or Generate from Free Text
  app.post('/api/trips', async (req, res) => {
    try {
      const user = resolveUser(req);
      const {
        destination,
        startDate,
        endDate,
        travelersCount = 2,
        totalBudget = 900,
        currency = 'USD',
        interests = ['Food & Dining', 'History & Culture'],
        personality = 'Foodie',
        freeTextPrompt = '',
      } = req.body || {};

      if (
        (!destination || String(destination).trim().length < 2) &&
        (!freeTextPrompt || String(freeTextPrompt).trim().length < 5)
      ) {
        return res.status(400).json({
          error:
            'Please provide a destination city or a free-text description of your trip.',
        });
      }

      // Extract destination or days count if free-text was used
      let parsedDest = String(destination || '').trim();
      let daysCount = 3;

      if (freeTextPrompt) {
        const dayMatch = String(freeTextPrompt).match(/(\d+)\s*day/i);
        if (dayMatch) {
          daysCount = Math.min(7, Math.max(1, parseInt(dayMatch[1], 10)));
        }
        // If user typed a city in freeTextPrompt (e.g. "4 days in Madrid, ..."), extract it
        const inCityMatch = String(freeTextPrompt).match(
          /\b(?:in|to|for|visit|visiting)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/
        );
        if (!parsedDest && inCityMatch) {
          parsedDest = inCityMatch[1].trim();
        } else if (!parsedDest) {
          parsedDest = String(freeTextPrompt).split(',')[0].trim();
        }
      }

      const start =
        startDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
      let end = endDate;
      if (startDate && endDate) {
        const diff = Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        daysCount = Math.min(7, Math.max(1, diff + 1));
      } else {
        const endObj = new Date(start);
        endObj.setDate(endObj.getDate() + daysCount - 1);
        end = endObj.toISOString().split('T')[0];
      }

      const verifiedPlaces = db.getVerifiedPlaces();
      const generated = await generateTripItineraryAI({
        user,
        freeTextPrompt,
        destination: parsedDest,
        startDate: start,
        endDate: end,
        daysCount,
        travelersCount: Math.max(1, Number(travelersCount || 2)),
        totalBudget: Math.max(50, Number(totalBudget || 850)),
        currency: String(currency || 'USD'),
        interests: Array.isArray(interests) ? interests : ['Food & Dining'],
        personality: (personality as TravelPersonality) || 'Foodie',
        verifiedPlaces,
      });

      const weatherForecast = await fetchRealWeatherForecast(
        generated.centerLat,
        generated.centerLng,
        start,
        generated.days.length
      );

      const validation = validateTripSchedule({
        days: generated.days,
        totalBudget: Number(totalBudget || 850),
        currency: String(currency || 'USD'),
        personality: (personality as TravelPersonality) || 'Foodie',
        verifiedPlaces,
        accommodationCost: generated.accommodation.totalStayCost,
        transportCost: generated.dailyTransport.totalTransportCost,
      });

      const inviteCode = `${generated.destination
        .slice(0, 3)
        .toUpperCase()}-2026-${Math.floor(10 + Math.random() * 89)}X`;

      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        title: generated.title,
        destination: generated.destination,
        country: generated.country,
        centerLat: generated.centerLat,
        centerLng: generated.centerLng,
        startDate: start,
        endDate: end,
        travelersCount: Math.max(1, Number(travelersCount || 2)),
        totalBudget: Math.max(50, Number(totalBudget || 850)),
        currency: String(currency || 'USD'),
        interests: Array.isArray(interests) ? interests : ['Food & Dining'],
        personality: (personality as TravelPersonality) || 'Foodie',
        accommodation: generated.accommodation,
        dailyTransport: generated.dailyTransport,
        inviteCode,
        ownerId: user.id,
        collaboratorIds: ['user-buddy-1'],
        days: generated.days,
        actualExpenses: [],
        packingList: [],
        weatherForecast,
        compromiseSubmissions: [
          {
            id: `sub-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            role: user.role,
            mustHaveInterests: Array.isArray(interests)
              ? interests.slice(0, 2)
              : ['Food & Dining'],
            preferredPace:
              personality === 'Slow Traveler' ? 'Relaxed' : 'Balanced',
            dailyBudgetComfort: Math.round(
              Number(totalBudget || 850) / Math.max(1, generated.days.length)
            ),
            personalWish:
              freeTextPrompt ||
              `Experience authentic ${generated.destination} highlights with ${personality} pacing.`,
            submittedAt: new Date().toISOString(),
          },
        ],
        diaryNotes: [],
        chatHistory: [
          {
            id: `chat-${Date.now()}`,
            sender: 'assistant',
            authorName: 'AI Trip Planner',
            text: `Generated a ${generated.days.length}-day ${personality} itinerary for ${generated.destination} grounded with real coordinates, recommended ${generated.accommodation.style.toLowerCase()} (${generated.accommodation.name}), and daily transit plan. Ask me anytime to swap stops, adjust for rain, or lighten the schedule.`,
            timestamp: new Date().toISOString(),
            promptVersion: PROMPT_VERSIONS.itinerary_generation,
          },
        ],
        validation,
        updatedAt: new Date().toISOString(),
      };

      newTrip.packingList = buildDefaultPackingList(newTrip, weatherForecast);
      db.saveTrip(newTrip);

      return res.status(201).json({
        trip: newTrip,
        usedFallback: generated.usedFallback,
        aiLogs: db.getAiLogs(),
        aiStatus: getAiConnectionStatus(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Failed to generate trip itinerary.',
        aiLogs: db.getAiLogs(),
        aiStatus: getAiConnectionStatus(),
      });
    }
  });

  // 4. UC3: Edit Itinerary (Add, Move, Remove, Reorder, Mystery Mode, Auto-Fix Timings, Personality Switch)
  app.put('/api/trips/:id/days', (req, res) => {
    const trip = db.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const { days, autoFixTimings, personality } = req.body || {};
    if (!Array.isArray(days)) {
      return res.status(400).json({ error: 'Valid days array is required.' });
    }

    let candidateDays = days;
    const personalityChanged =
      personality && personality !== trip.personality;

    if (personality) {
      trip.personality = personality;
    }

    if (personalityChanged) {
      const { accommodation, dailyTransport } =
        buildRecommendedAccommodationAndTransit({
          destination: trip.destination,
          country: trip.country,
          centerLat: trip.centerLat,
          centerLng: trip.centerLng,
          daysCount: Math.max(1, days.length),
          personality: trip.personality,
          totalBudget: trip.totalBudget,
          currency: trip.currency,
        });
      trip.accommodation = accommodation;
      trip.dailyTransport = dailyTransport;
      candidateDays = applyPersonalityProfileToDays(candidateDays, {
        destination: trip.destination,
        country: trip.country,
        personality: trip.personality,
        totalBudget: trip.totalBudget,
        currency: trip.currency,
        accommodationCost: accommodation.totalStayCost,
        transportCost: dailyTransport.totalTransportCost,
      });
    }

    const verifiedPlaces = db.getVerifiedPlaces();
    let processedDays = groundAndEnrichDays(
      candidateDays,
      verifiedPlaces,
      trip.centerLat,
      trip.centerLng
    );

    if (autoFixTimings) {
      processedDays = autoFixScheduleTimings(processedDays);
      processedDays = groundAndEnrichDays(
        processedDays,
        verifiedPlaces,
        trip.centerLat,
        trip.centerLng
      );
    }

    trip.days = processedDays;
    trip.validation = validateTripSchedule({
      days: trip.days,
      totalBudget: trip.totalBudget,
      currency: trip.currency,
      personality: trip.personality,
      verifiedPlaces,
      accommodationCost: trip.accommodation?.totalStayCost ?? 0,
      transportCost: trip.dailyTransport?.totalTransportCost ?? 0,
    });

    db.saveTrip(trip);
    return res.json({ trip });
  });

  // 5. UC4: Chat with the Planner (Conversational Mutation & Smart Re-plan)
  app.post('/api/trips/:id/chat-replan', async (req, res) => {
    try {
      const user = resolveUser(req);
      const trip = db.getTripById(req.params.id);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found.' });
      }
      const { message } = req.body || {};
      if (!message || String(message).trim().length < 2) {
        return res
          .status(400)
          .json({ error: 'Please enter a message for the AI Planner.' });
      }

      const userChatMsg = {
        id: `msg-u-${Date.now()}`,
        sender: 'user' as const,
        authorName: user.name,
        text: String(message).trim(),
        timestamp: new Date().toISOString(),
      };
      trip.chatHistory.push(userChatMsg);

      const verifiedPlaces = db.getVerifiedPlaces();
      const replanned = await chatMutateItineraryAI({
        user,
        trip,
        userMessage: String(message).trim(),
        verifiedPlaces,
      });

      trip.days = replanned.days;
      trip.validation = validateTripSchedule({
        days: trip.days,
        totalBudget: trip.totalBudget,
        currency: trip.currency,
        personality: trip.personality,
        verifiedPlaces,
        accommodationCost: trip.accommodation?.totalStayCost ?? 0,
        transportCost: trip.dailyTransport?.totalTransportCost ?? 0,
      });

      const assistantMsg = {
        id: `msg-a-${Date.now() + 1}`,
        sender: 'assistant' as const,
        authorName: 'AI Trip Planner',
        text: replanned.assistantReply,
        timestamp: new Date().toISOString(),
        diffSummary: replanned.diffSummary,
        promptVersion: PROMPT_VERSIONS.chat_replan,
      };
      trip.chatHistory.push(assistantMsg);

      db.saveTrip(trip);
      return res.json({
        trip,
        diffSummary: replanned.diffSummary,
        usedFallback: replanned.usedFallback,
        aiLogs: db.getAiLogs(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Unable to process planner request.',
        aiLogs: db.getAiLogs(),
      });
    }
  });

  // 6. UC5: Budget Tracking (Add / Delete Expense & Update Budget)
  app.post('/api/trips/:id/expenses', (req, res) => {
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { title, category, amount, date, paidBy, note } = req.body || {};
    if (!title || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'Please enter a valid expense title and positive amount.',
      });
    }

    trip.actualExpenses.unshift({
      id: `exp-${Date.now()}`,
      title: String(title).trim(),
      category: category || 'Food & Dining',
      amount: Math.round(Number(amount) * 100) / 100,
      date: date || trip.startDate,
      paidBy: paidBy || 'Aria Vance',
      note: note ? String(note).trim() : undefined,
    });

    db.saveTrip(trip);
    return res.status(201).json({ trip });
  });

  app.delete('/api/trips/:id/expenses/:expenseId', (req, res) => {
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    trip.actualExpenses = trip.actualExpenses.filter(
      (e) => e.id !== req.params.expenseId
    );
    db.saveTrip(trip);
    return res.json({ trip });
  });

  app.put('/api/trips/:id/budget', (req, res) => {
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { totalBudget } = req.body || {};
    if (Number.isNaN(Number(totalBudget)) || Number(totalBudget) < 50) {
      return res
        .status(400)
        .json({ error: 'Budget must be at least 50 in trip currency.' });
    }
    trip.totalBudget = Number(totalBudget);
    trip.validation = validateTripSchedule({
      days: trip.days,
      totalBudget: trip.totalBudget,
      currency: trip.currency,
      personality: trip.personality,
      verifiedPlaces: db.getVerifiedPlaces(),
      accommodationCost: trip.accommodation?.totalStayCost ?? 0,
      transportCost: trip.dailyTransport?.totalTransportCost ?? 0,
    });
    db.saveTrip(trip);
    return res.json({ trip });
  });

  // 6b. One-Click AI Budget Optimizer (Optimize Itinerary to Fit Budget)
  app.post('/api/trips/:id/optimize-budget', async (req, res) => {
    try {
      const user = resolveUser(req);
      const trip = db.getTripById(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const verifiedPlaces = db.getVerifiedPlaces();
      const optimized = await optimizeTripBudgetAI({
        user,
        trip,
        verifiedPlaces,
      });

      trip.days = optimized.days;
      if (optimized.accommodation) {
        trip.accommodation = optimized.accommodation;
      }
      if (optimized.dailyTransport) {
        trip.dailyTransport = optimized.dailyTransport;
      }

      trip.validation = validateTripSchedule({
        days: trip.days,
        totalBudget: trip.totalBudget,
        currency: trip.currency,
        personality: trip.personality,
        verifiedPlaces,
        accommodationCost: trip.accommodation?.totalStayCost ?? 0,
        transportCost: trip.dailyTransport?.totalTransportCost ?? 0,
      });

      trip.chatHistory.push({
        id: `msg-opt-${Date.now()}`,
        sender: 'assistant' as const,
        authorName: 'AI Trip Planner',
        text: optimized.assistantReply,
        timestamp: new Date().toISOString(),
        diffSummary: optimized.diffSummary,
        promptVersion: PROMPT_VERSIONS.chat_replan,
      });

      db.saveTrip(trip);
      return res.json({
        trip,
        previousEstimate: optimized.previousEstimate,
        newEstimate: optimized.newEstimate,
        savedAmount: optimized.savedAmount,
        diffSummary: optimized.diffSummary,
        usedFallback: optimized.usedFallback,
        aiLogs: db.getAiLogs(),
        aiStatus: getAiConnectionStatus(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Failed to optimize trip budget.',
        aiLogs: db.getAiLogs(),
        aiStatus: getAiConnectionStatus(),
      });
    }
  });

  // 7. UC6: Packing List Generation with Open-Meteo Weather API
  app.post('/api/trips/:id/packing/generate', async (req, res) => {
    try {
      const user = resolveUser(req);
      const trip = db.getTripById(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const weather = await fetchRealWeatherForecast(
        trip.centerLat,
        trip.centerLng,
        trip.startDate,
        trip.days.length
      );
      trip.weatherForecast = weather;

      const generated = await generatePackingListAI({
        user,
        trip,
        weather,
      });

      trip.packingList = generated.items;
      db.saveTrip(trip);
      return res.json({
        trip,
        usedFallback: generated.usedFallback,
        aiLogs: db.getAiLogs(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Failed to generate packing list.',
        aiLogs: db.getAiLogs(),
      });
    }
  });

  app.put('/api/trips/:id/packing', (req, res) => {
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { packingList } = req.body || {};
    if (Array.isArray(packingList)) {
      trip.packingList = packingList;
      db.saveTrip(trip);
    }
    return res.json({ trip });
  });

  // 8. UC7: Share & Collaborate (Join by Invite Code, Stop Voting, Comments)
  app.post('/api/trips/join', (req, res) => {
    const user = resolveUser(req);
    const { inviteCode } = req.body || {};
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res
        .status(400)
        .json({ error: 'Please enter a valid trip invite code.' });
    }

    const trip = db.getTripByInviteCode(inviteCode);
    if (!trip) {
      return res.status(404).json({
        error: `No shared trip found matching invite code "${inviteCode}". Try IST-2026-89B or TYO-2026-44K.`,
      });
    }

    if (
      trip.ownerId !== user.id &&
      !trip.collaboratorIds.includes(user.id)
    ) {
      trip.collaboratorIds.push(user.id);
      db.saveTrip(trip);
    }

    return res.json({ trip });
  });

  app.post('/api/trips/:id/stops/:stopId/vote', (req, res) => {
    const user = resolveUser(req);
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { direction } = req.body || {}; // 'up' | 'down'
    for (const day of trip.days) {
      const stop = day.stops.find((s) => s.id === req.params.stopId);
      if (stop) {
        stop.upvotes = (stop.upvotes || []).filter((id) => id !== user.id);
        stop.downvotes = (stop.downvotes || []).filter((id) => id !== user.id);
        if (direction === 'up') {
          stop.upvotes.push(user.id);
        } else if (direction === 'down') {
          stop.downvotes.push(user.id);
        }
        break;
      }
    }

    db.saveTrip(trip);
    return res.json({ trip });
  });

  app.post('/api/trips/:id/stops/:stopId/comments', (req, res) => {
    const user = resolveUser(req);
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { text } = req.body || {};
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    for (const day of trip.days) {
      const stop = day.stops.find((s) => s.id === req.params.stopId);
      if (stop) {
        stop.comments = stop.comments || [];
        stop.comments.push({
          id: `cmt-${Date.now()}`,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          text: String(text).trim(),
          createdAt: new Date().toISOString(),
        });
        break;
      }
    }

    db.saveTrip(trip);
    return res.json({ trip });
  });

  // 9. Creative Feature 3: Group Compromise (AI Negotiator)
  app.post('/api/trips/:id/compromise/submit', (req, res) => {
    const user = resolveUser(req);
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const {
      mustHaveInterests = ['Food & Dining'],
      preferredPace = 'Balanced',
      dailyBudgetComfort = 120,
      personalWish = '',
    } = req.body || {};

    if (!personalWish || String(personalWish).trim().length < 4) {
      return res
        .status(400)
        .json({ error: 'Please describe your personal wish or must-see activity.' });
    }

    const existingIdx = trip.compromiseSubmissions.findIndex(
      (s) => s.userId === user.id
    );
    const submission = {
      id: `sub-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      mustHaveInterests: Array.isArray(mustHaveInterests)
        ? mustHaveInterests
        : ['Food & Dining'],
      preferredPace,
      dailyBudgetComfort: Number(dailyBudgetComfort || 120),
      personalWish: String(personalWish).trim(),
      submittedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      trip.compromiseSubmissions[existingIdx] = submission;
    } else {
      trip.compromiseSubmissions.push(submission);
    }

    db.saveTrip(trip);
    return res.json({ trip });
  });

  app.post('/api/trips/:id/compromise/negotiate', async (req, res) => {
    try {
      const user = resolveUser(req);
      const trip = db.getTripById(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const negotiated = await negotiateGroupCompromiseAI({
        user,
        trip,
        submissions: trip.compromiseSubmissions,
        verifiedPlaces: db.getVerifiedPlaces(),
      });

      trip.compromiseResult = negotiated.compromiseResult;
      db.saveTrip(trip);

      return res.json({
        trip,
        usedFallback: negotiated.usedFallback,
        aiLogs: db.getAiLogs(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Failed to negotiate group compromise.',
        aiLogs: db.getAiLogs(),
      });
    }
  });

  // 10. Creative Feature 4: Trip Memories (Travel Diary)
  app.post('/api/trips/:id/diary/notes', (req, res) => {
    const user = resolveUser(req);
    const trip = db.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { stopId, stopName, dayNumber, caption, photoDataUrl, mood } =
      req.body || {};
    if (!caption || String(caption).trim().length < 3) {
      return res
        .status(400)
        .json({ error: 'Please write a short memory note for this stop.' });
    }

    trip.diaryNotes.unshift({
      id: `diary-${Date.now()}`,
      stopId: stopId || 'custom',
      stopName: stopName || trip.destination,
      dayNumber: Number(dayNumber || 1),
      authorName: user.name,
      caption: String(caption).trim(),
      photoDataUrl: photoDataUrl || 'svg:bosphorus_ferry',
      mood: mood || 'Inspired',
      createdAt: new Date().toISOString(),
    });

    db.saveTrip(trip);
    return res.status(201).json({ trip });
  });

  app.post('/api/trips/:id/diary/generate', async (req, res) => {
    try {
      const user = resolveUser(req);
      const trip = db.getTripById(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const generated = await generateTravelDiaryAI({
        user,
        trip,
        notes: trip.diaryNotes,
      });

      trip.diaryStory = generated.story;
      db.saveTrip(trip);
      return res.json({
        trip,
        usedFallback: generated.usedFallback,
        aiLogs: db.getAiLogs(),
      });
    } catch (err: any) {
      const code = err?.statusCode || 500;
      return res.status(code).json({
        error: err?.message || 'Failed to generate travel diary story.',
        aiLogs: db.getAiLogs(),
      });
    }
  });

  // 11. Geocoding lookup (Verified Places + Nominatim OpenStreetMap fallback)
  app.get('/api/geocode', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required.' });
    }

    const verified = db.getVerifiedPlaces().find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        (!city || p.city.toLowerCase().includes(city.toLowerCase()))
    );
    if (verified) {
      return res.json({
        name: verified.name,
        lat: verified.lat,
        lng: verified.lng,
        openingHours: verified.openingHours,
        verifiedPlaceId: verified.id,
        source: 'verified_catalog',
      });
    }

    try {
      const searchQ = encodeURIComponent(city ? `${query}, ${city}` : query);
      const url = `https://nominatim.openstreetmap.org/search?q=${searchQ}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SmartTripPlanner/1.0' },
      });
      if (response.ok) {
        const results: any = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          return res.json({
            name: query,
            lat: Number(parseFloat(results[0].lat).toFixed(5)),
            lng: Number(parseFloat(results[0].lon).toFixed(5)),
            openingHours: '09:00-19:00',
            source: 'nominatim_osm',
          });
        }
      }
    } catch {
      // Fallback to city center offset
    }

    return res.json({
      name: query,
      lat: 41.0122,
      lng: 28.9765,
      openingHours: '09:00-19:00',
      source: 'city_centroid',
    });
  });

  // 12. UC8: Admin Operations (Block/Unblock User & Manage Verified Places)
  app.post('/api/admin/users/:userId/block', (req, res) => {
    const { isBlocked } = req.body || {};
    const updated = db.toggleUserBlock(req.params.userId, Boolean(isBlocked));
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: updated, users: db.getUsers() });
  });

  app.post('/api/admin/places', (req, res) => {
    const user = resolveUser(req);
    const {
      city,
      country,
      name,
      category,
      lat,
      lng,
      openingHours,
      typicalCostUsd,
      isIndoor,
    } = req.body || {};

    if (
      !city ||
      !name ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(lng))
    ) {
      return res.status(400).json({
        error: 'City, place name, and valid latitude/longitude are required.',
      });
    }

    const place = db.addVerifiedPlace({
      id: `vp-${Date.now()}`,
      city: String(city).trim(),
      country: String(country || 'International').trim(),
      name: String(name).trim(),
      category: category || 'History & Culture',
      lat: Number(lat),
      lng: Number(lng),
      openingHours: String(openingHours || '09:00-18:00').trim(),
      typicalCostUsd: Number(typicalCostUsd || 20),
      isIndoor: Boolean(isIndoor),
      verifiedBy: user.name,
      updatedAt: new Date().toISOString(),
    });

    return res.status(201).json({
      place,
      verifiedPlaces: db.getVerifiedPlaces(),
    });
  });

  app.delete('/api/admin/places/:id', (req, res) => {
    db.deleteVerifiedPlace(req.params.id);
    return res.json({ verifiedPlaces: db.getVerifiedPlaces() });
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

const PORT = Number(process.env.PORT) || 3000;
createAppServer().then((app) => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Trip Planner server listening on http://0.0.0.0:${PORT}`);
  });
});
