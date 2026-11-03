import {
  AiUsageLog,
  CompromiseResult,
  CompromiseSubmission,
  DiaryMemoryNote,
  DiaryStory,
  PackingItem,
  StopCategory,
  TravelPersonality,
  Trip,
  TripDay,
  User,
  VerifiedPlace,
  WeatherForecastDay,
} from '../types.ts';
import { groundAndEnrichDays, validateTripSchedule } from './validator.ts';

export const SEED_USERS: User[] = [
  {
    id: 'user-traveler-1',
    name: 'Aria Vance',
    email: 'aria.vance@smarttrip.io',
    role: 'traveler',
    avatarInitials: 'AV',
    isBlocked: false,
    createdAt: '2026-09-12T08:30:00Z',
  },
  {
    id: 'user-buddy-1',
    name: 'Liam Chen',
    email: 'liam.chen@smarttrip.io',
    role: 'buddy',
    avatarInitials: 'LC',
    isBlocked: false,
    createdAt: '2026-09-15T11:15:00Z',
  },
  {
    id: 'user-admin-1',
    name: 'Elena Rostova',
    email: 'elena.admin@smarttrip.io',
    role: 'admin',
    avatarInitials: 'ER',
    isBlocked: false,
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'user-traveler-2',
    name: 'Marcus Thorne',
    email: 'm.thorne@example.com',
    role: 'traveler',
    avatarInitials: 'MT',
    isBlocked: true,
    createdAt: '2026-10-04T14:20:00Z',
  },
];

export const SEED_VERIFIED_PLACES: VerifiedPlace[] = [
  // Istanbul
  {
    id: 'vp-ist-1',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Hagia Sophia Grand Mosque',
    category: 'History & Culture',
    lat: 41.0086,
    lng: 28.9802,
    openingHours: '09:00-19:30',
    typicalCostUsd: 28,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-2',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Basilica Cistern (Yerebatan Sarnici)',
    category: 'History & Culture',
    lat: 41.0084,
    lng: 28.9779,
    openingHours: '09:00-18:30',
    typicalCostUsd: 22,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-3',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Tarihi Sultanahmet Koftecisi',
    category: 'Food & Dining',
    lat: 41.0079,
    lng: 28.9772,
    openingHours: '11:00-22:30',
    typicalCostUsd: 16,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-4',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Gulhane Park & Tea Terraces',
    category: 'Nature & Parks',
    lat: 41.0132,
    lng: 28.9815,
    openingHours: '07:00-22:00',
    typicalCostUsd: 8,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-5',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Spice Bazaar (Misir Carsisi)',
    category: 'Shopping & Markets',
    lat: 41.0165,
    lng: 28.9705,
    openingHours: '08:30-19:30',
    typicalCostUsd: 25,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-6',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Pandeli Restaurant above Spice Bazaar',
    category: 'Food & Dining',
    lat: 41.0167,
    lng: 28.9707,
    openingHours: '11:30-18:30',
    typicalCostUsd: 38,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-7',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Galata Tower Panoramic Deck',
    category: 'History & Culture',
    lat: 41.0256,
    lng: 28.9741,
    openingHours: '08:30-22:00',
    typicalCostUsd: 30,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-8',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Istanbul Modern Art Museum (Karakoy)',
    category: 'Art & Museums',
    lat: 41.0261,
    lng: 28.9826,
    openingHours: '10:00-18:00',
    typicalCostUsd: 20,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-9',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Kadikoy Produce & Fish Market',
    category: 'Food & Dining',
    lat: 40.9896,
    lng: 29.0238,
    openingHours: '08:00-21:00',
    typicalCostUsd: 22,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-10',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Ciya Sofrasi Anatolian Kitchen',
    category: 'Food & Dining',
    lat: 40.9893,
    lng: 29.0247,
    openingHours: '11:30-22:00',
    typicalCostUsd: 28,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-11',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Moda Coastal Promenade',
    category: 'Nature & Parks',
    lat: 40.9794,
    lng: 29.0255,
    openingHours: '06:00-23:30',
    typicalCostUsd: 5,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-12',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Grand Bazaar Artisans Quarter',
    category: 'Shopping & Markets',
    lat: 41.0107,
    lng: 28.9681,
    openingHours: '08:30-19:00',
    typicalCostUsd: 35,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-13',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Topkapi Palace Imperial Courtyards',
    category: 'History & Culture',
    lat: 41.0115,
    lng: 28.9834,
    openingHours: '09:00-18:00',
    typicalCostUsd: 42,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-ist-14',
    city: 'Istanbul',
    country: 'Turkey',
    name: 'Karakoy Gulluoglu Baklava Roastery',
    category: 'Food & Dining',
    lat: 41.0226,
    lng: 28.9776,
    openingHours: '07:30-23:30',
    typicalCostUsd: 14,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  // Paris
  {
    id: 'vp-par-1',
    city: 'Paris',
    country: 'France',
    name: 'Musee d Orsay Impressionist Gallery',
    category: 'Art & Museums',
    lat: 48.86,
    lng: 2.3266,
    openingHours: '09:30-18:00',
    typicalCostUsd: 18,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-par-2',
    city: 'Paris',
    country: 'France',
    name: 'Jardin du Luxembourg',
    category: 'Nature & Parks',
    lat: 48.8462,
    lng: 2.3372,
    openingHours: '07:30-20:30',
    typicalCostUsd: 0,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-par-3',
    city: 'Paris',
    country: 'France',
    name: 'Marche des Enfants Rouges',
    category: 'Food & Dining',
    lat: 48.8628,
    lng: 2.362,
    openingHours: '08:30-20:30',
    typicalCostUsd: 24,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-par-4',
    city: 'Paris',
    country: 'France',
    name: 'Sainte-Chapelle Royal Stained Glass',
    category: 'History & Culture',
    lat: 48.8554,
    lng: 2.345,
    openingHours: '09:00-17:00',
    typicalCostUsd: 15,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  // Tokyo
  {
    id: 'vp-tyo-1',
    city: 'Tokyo',
    country: 'Japan',
    name: 'Tsukiji Outer Market Culinary Stalls',
    category: 'Food & Dining',
    lat: 35.6655,
    lng: 139.7707,
    openingHours: '07:00-15:00',
    typicalCostUsd: 26,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-tyo-2',
    city: 'Tokyo',
    country: 'Japan',
    name: 'Senso-ji Temple & Nakamise Street',
    category: 'History & Culture',
    lat: 35.7148,
    lng: 139.7967,
    openingHours: '06:00-19:00',
    typicalCostUsd: 10,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-tyo-3',
    city: 'Tokyo',
    country: 'Japan',
    name: 'teamLab Planets Toyosu Digital Museum',
    category: 'Art & Museums',
    lat: 35.6491,
    lng: 139.7898,
    openingHours: '09:00-21:00',
    typicalCostUsd: 32,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-tyo-4',
    city: 'Tokyo',
    country: 'Japan',
    name: 'Shinjuku Gyoen National Garden',
    category: 'Nature & Parks',
    lat: 35.6852,
    lng: 139.71,
    openingHours: '09:00-17:30',
    typicalCostUsd: 5,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  // Rome
  {
    id: 'vp-rom-1',
    city: 'Rome',
    country: 'Italy',
    name: 'Pantheon & Piazza della Rotonda',
    category: 'History & Culture',
    lat: 41.8986,
    lng: 12.4769,
    openingHours: '09:00-19:00',
    typicalCostUsd: 10,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-rom-2',
    city: 'Rome',
    country: 'Italy',
    name: 'Mercato Centrale & Trastevere Trattoria',
    category: 'Food & Dining',
    lat: 41.8897,
    lng: 12.4695,
    openingHours: '10:00-23:00',
    typicalCostUsd: 28,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
];

export function buildIstanbulDays(
  startDate = '2026-11-12',
  personality: TravelPersonality = 'Foodie'
): TripDay[] {
  const baseDate = new Date(startDate);
  const getDateStr = (offset: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const rawDays: TripDay[] = [
    {
      dayNumber: 1,
      date: getDateStr(0),
      title: 'Sultanahmet Imperial Spires & subterranean Marvels',
      mysteryModeEnabled: false,
      revealedStopCount: 3,
      dailyBriefing: {
        vibeSummary: `An evocative opening day tracing Byzantine domes and Ottoman kitchens at a ${personality.toLowerCase()} rhythm.`,
        etiquetteTip:
          'Carry a lightweight scarf for mosque visits and remove shoes at the carpeted threshold.',
        wearAdvice:
          'Comfortable cushioned walking shoes for historic cobblestone lanes and a windproof layer for evening Bosphorus breezes.',
      },
      stops: [
        {
          id: 'stop-ist-101',
          name: 'Hagia Sophia Grand Mosque',
          description:
            'Explore the sixth-century soaring dome, golden mosaics, and calligraphy medallions during calm morning hours.',
          category: 'History & Culture',
          startTime: '09:30',
          endTime: '11:15',
          durationMinutes: 105,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '09:00-19:30',
          estimatedCost: 28,
          lat: 41.0086,
          lng: 28.9802,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-1',
          mysteryClue:
            'Look up beneath a dome that appeared suspended from heaven by a golden chain for fifteen centuries.',
          isCompleted: true,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [
            {
              id: 'c-101',
              authorId: 'user-buddy-1',
              authorName: 'Liam Chen',
              authorRole: 'buddy',
              text: 'Let us arrive right at 09:30 to beat the tour groups at the upper gallery entrance.',
              createdAt: '2026-11-01T14:20:00Z',
            },
          ],
        },
        {
          id: 'stop-ist-102',
          name: 'Tarihi Sultanahmet Koftecisi',
          description:
            'A century-old culinary institution serving charcoal-grilled lamb kofte, white bean piyaz salad, and semolina helva.',
          category: 'Food & Dining',
          startTime: '11:45',
          endTime: '13:00',
          durationMinutes: 75,
          travelFromPrevMinutes: 10,
          distanceFromPrevKm: 0.28,
          openingHours: '11:00-22:30',
          estimatedCost: 16,
          lat: 41.0079,
          lng: 28.9772,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-3',
          mysteryClue:
            'Follow the aroma of sizzling charcoal and cumin to a white-tiled dining room operating since 1920.',
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-103',
          name: 'Basilica Cistern (Yerebatan Sarnici)',
          description:
            'Descend beneath the streets into an illuminated forest of 336 marble columns and carved Medusa heads.',
          category: 'History & Culture',
          startTime: '13:30',
          endTime: '15:00',
          durationMinutes: 90,
          travelFromPrevMinutes: 8,
          distanceFromPrevKm: 0.08,
          openingHours: '09:00-18:30',
          estimatedCost: 22,
          lat: 41.0084,
          lng: 28.9779,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-2',
          mysteryClue:
            'Descend fifty-two stone steps into a subterranean cathedral of water guarded by twin gorgons.',
          isCompleted: false,
          upvotes: ['user-buddy-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-104',
          name: 'Gulhane Park & Tea Terraces',
          description:
            'Unwind in the outer gardens of the imperial palace with tulip-glass black tea overlooking the Golden Horn mouth.',
          category: 'Nature & Parks',
          startTime: '15:30',
          endTime: '17:15',
          durationMinutes: 105,
          travelFromPrevMinutes: 12,
          distanceFromPrevKm: 0.62,
          openingHours: '07:00-22:00',
          estimatedCost: 8,
          lat: 41.0132,
          lng: 28.9815,
          isIndoor: false,
          verifiedPlaceId: 'vp-ist-4',
          mysteryClue:
            'Where plane trees shade former royal rose gardens and brass samovars steam beside the strait.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
      ],
    },
    {
      dayNumber: 2,
      date: getDateStr(1),
      title: 'Spice Vaults, Golden Horn Crossing & Galata Sunset',
      mysteryModeEnabled: false,
      revealedStopCount: 1,
      dailyBriefing: {
        vibeSummary:
          'A sensory journey from aromatic spice arcades across the Galata Bridge to contemporary waterfront art.',
        etiquetteTip:
          'Polite bargaining is welcome on bulk spices and ceramics, and vendors often offer apple or pomegranate tea first.',
        wearAdvice:
          'Bring a tote bag for spice tins and wear breathable layers for climbing the steep Galata hill.',
      },
      stops: [
        {
          id: 'stop-ist-201',
          name: 'Spice Bazaar (Misir Carsisi)',
          description:
            'Sample Iranian saffron, sumac, pistachio lokum, and aged Anatolian cheeses inside the 1664 L-shaped bazaar.',
          category: 'Shopping & Markets',
          startTime: '09:30',
          endTime: '11:30',
          durationMinutes: 120,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '08:30-19:30',
          estimatedCost: 25,
          lat: 41.0165,
          lng: 28.9705,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-5',
          mysteryClue:
            'Enter the seventeenth-century vaulted arcade perfumed with saffron threads, rose petals, and roasted pistachios.',
          isCompleted: true,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-202',
          name: 'Pandeli Restaurant above Spice Bazaar',
          description:
            'Dine surrounded by turquoise Iznik tiles on sea bass baked in parchment and smoky eggplant pie.',
          category: 'Food & Dining',
          startTime: '12:00',
          endTime: '13:45',
          durationMinutes: 105,
          travelFromPrevMinutes: 5,
          distanceFromPrevKm: 0.03,
          openingHours: '11:30-18:30',
          estimatedCost: 38,
          lat: 41.0167,
          lng: 28.9707,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-6',
          mysteryClue:
            'Climb a narrow spiral staircase above the bazaar gateway into a turquoise-tiled room beloved since 1901.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-203',
          name: 'Istanbul Modern Art Museum (Karakoy)',
          description:
            'Explore modern Turkish sculpture, photography, and the Renzo Piano waterfront viewing deck.',
          category: 'Art & Museums',
          startTime: '14:30',
          endTime: '16:30',
          durationMinutes: 120,
          travelFromPrevMinutes: 18,
          distanceFromPrevKm: 1.47,
          openingHours: '10:00-18:00',
          typicalCostUsd: 20,
          estimatedCost: 20,
          lat: 41.0261,
          lng: 28.9826,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-8',
          mysteryClue:
            'A shimmering glass vessel moored on the Karakoy dock where contemporary canvases meet Bosphorus ferries.',
          isCompleted: false,
          upvotes: ['user-buddy-1'],
          downvotes: [],
          comments: [],
        } as any,
        {
          id: 'stop-ist-204',
          name: 'Galata Tower Panoramic Deck',
          description:
            'Watch golden hour illuminate two continents from the medieval Genoese watchtower parapet.',
          category: 'History & Culture',
          startTime: '17:15',
          endTime: '19:00',
          durationMinutes: 105,
          travelFromPrevMinutes: 12,
          distanceFromPrevKm: 0.72,
          openingHours: '08:30-22:00',
          estimatedCost: 30,
          lat: 41.0256,
          lng: 28.9741,
          isIndoor: false,
          verifiedPlaceId: 'vp-ist-7',
          mysteryClue:
            'Ascend the conical stone cylinder built by Genoese merchants in 1348 for a 360-degree skyline embrace.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
      ],
    },
    {
      dayNumber: 3,
      date: getDateStr(2),
      title: 'Ferry to Asia: Kadikoy Markets & Moda Seafront',
      mysteryModeEnabled: true,
      revealedStopCount: 1,
      dailyBriefing: {
        vibeSummary:
          'Cross the Bosphorus by commuter ferry to the Asian shore for neighborhood markets and sunset coastal walks.',
        etiquetteTip:
          'Tap your Istanbulkart at the Eminonu ferry turnstile and toss a bit of simit to the trailing seagulls.',
        wearAdvice:
          'Pack a light windbreaker for the open upper ferry deck and sunglasses for the afternoon Moda promenade.',
      },
      stops: [
        {
          id: 'stop-ist-301',
          name: 'Kadikoy Produce & Fish Market',
          description:
            'Wander bustling pedestrian lanes lined with olive barrels, honeycombs, pickled turnip stalls, and coffee roasters.',
          category: 'Food & Dining',
          startTime: '10:00',
          endTime: '12:00',
          durationMinutes: 120,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '08:00-21:00',
          estimatedCost: 22,
          lat: 40.9896,
          lng: 29.0238,
          isIndoor: false,
          verifiedPlaceId: 'vp-ist-9',
          mysteryClue:
            'Cross the strait to the Asian shore where fishermen, olive curers, and spice merchants share lively cobbles.',
          isCompleted: true,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-302',
          name: 'Ciya Sofrasi Anatolian Kitchen',
          description:
            'Taste forgotten regional dishes from southeastern Anatolia—lamb with sour cherries, stuffed quince, and wild herb mezze.',
          category: 'Food & Dining',
          startTime: '12:30',
          endTime: '14:15',
          durationMinutes: 105,
          travelFromPrevMinutes: 5,
          distanceFromPrevKm: 0.08,
          openingHours: '11:30-22:00',
          estimatedCost: 28,
          lat: 40.9893,
          lng: 29.0247,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-10',
          mysteryClue:
            'Chef Musa Dagdeviren’s celebrated archive of regional recipes where fruit and roasted meats harmonize.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-303',
          name: 'Moda Coastal Promenade',
          description:
            'Stroll along the Marmara shoreline lawns watching ferries glide toward the historic peninsula silhouette.',
          category: 'Nature & Parks',
          startTime: '15:00',
          endTime: '17:30',
          durationMinutes: 150,
          travelFromPrevMinutes: 16,
          distanceFromPrevKm: 1.14,
          openingHours: '06:00-23:30',
          estimatedCost: 5,
          lat: 40.9794,
          lng: 29.0255,
          isIndoor: false,
          verifiedPlaceId: 'vp-ist-11',
          mysteryClue:
            'Follow the nostalgia tram tracks down to rocky seafront lawns facing the Princes’ Islands.',
          isCompleted: false,
          upvotes: ['user-buddy-1'],
          downvotes: [],
          comments: [],
        },
      ],
    },
    {
      dayNumber: 4,
      date: getDateStr(3),
      title: 'Imperial Courtyards & Artisanal Baklava Finale',
      mysteryModeEnabled: false,
      revealedStopCount: 3,
      dailyBriefing: {
        vibeSummary:
          'A celebratory closing day exploring Ottoman palace treasuries, copper artisans, and pistachio baklava.',
        etiquetteTip:
          'Keep shoulders and knees covered inside the Sacred Relics chamber at Topkapi Palace.',
        wearAdvice:
          'Comfortable daypack for carrying boxed baklava and hand-loomed pestemal towels home.',
      },
      stops: [
        {
          id: 'stop-ist-401',
          name: 'Topkapi Palace Imperial Courtyards',
          description:
            'Tour the terraced pavilions, Harem tilework, and Bosphorus-facing marble kiosks of the Ottoman sultans.',
          category: 'History & Culture',
          startTime: '09:30',
          endTime: '12:30',
          durationMinutes: 180,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '09:00-18:00',
          estimatedCost: 42,
          lat: 41.0115,
          lng: 28.9834,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-13',
          mysteryClue:
            'Four tree-lined imperial courtyards crowning the headland where the Bosphorus meets the Sea of Marmara.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-402',
          name: 'Grand Bazaar Artisans Quarter',
          description:
            'Explore the historic Cebeci Han caravanserai workshops for hand-hammered copperware and silk textiles.',
          category: 'Shopping & Markets',
          startTime: '13:30',
          endTime: '15:30',
          durationMinutes: 120,
          travelFromPrevMinutes: 15,
          distanceFromPrevKm: 1.29,
          openingHours: '08:30-19:00',
          estimatedCost: 35,
          lat: 41.0107,
          lng: 28.9681,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-12',
          mysteryClue:
            'Sixty-one covered streets and four thousand shops forming the world’s oldest covered bazaar labyrinth.',
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-403',
          name: 'Karakoy Gulluoglu Baklava Roastery',
          description:
            'Toast the journey with forty-layer Gaziantep pistachio baklava and clotted kaymak cream.',
          category: 'Food & Dining',
          startTime: '16:15',
          endTime: '17:30',
          durationMinutes: 75,
          travelFromPrevMinutes: 17,
          distanceFromPrevKm: 1.54,
          openingHours: '07:30-23:30',
          estimatedCost: 14,
          lat: 41.0226,
          lng: 28.9776,
          isIndoor: true,
          verifiedPlaceId: 'vp-ist-14',
          mysteryClue:
            'Golden phyllo sheets rolled paper-thin and layered with emerald Gaziantep pistachios near the port.',
          isCompleted: false,
          upvotes: ['user-traveler-1', 'user-buddy-1'],
          downvotes: [],
          comments: [],
        },
      ],
    },
  ];

  // Respect Slow Traveler pacing if selected
  const pacedDays =
    personality === 'Slow Traveler'
      ? rawDays.map((d) => ({ ...d, stops: d.stops.slice(0, 3) }))
      : rawDays;

  return groundAndEnrichDays(
    pacedDays,
    SEED_VERIFIED_PLACES,
    41.0082,
    28.9784
  );
}

export function buildFallbackCityTemplate(params: {
  destination: string;
  startDate: string;
  daysCount: number;
  personality: TravelPersonality;
  verifiedPlaces: VerifiedPlace[];
}): {
  destination: string;
  country: string;
  centerLat: number;
  centerLng: number;
  title: string;
  days: TripDay[];
} {
  const destLower = params.destination.toLowerCase();
  if (destLower.includes('istanbul') || destLower.includes('turkey')) {
    const days = buildIstanbulDays(params.startDate, params.personality).slice(
      0,
      Math.max(1, Math.min(7, params.daysCount))
    );
    return {
      destination: 'Istanbul',
      country: 'Turkey',
      centerLat: 41.0082,
      centerLng: 28.9784,
      title: `Istanbul ${params.personality} Expedition`,
      days,
    };
  }

  if (destLower.includes('tokyo') || destLower.includes('japan')) {
    const baseDate = new Date(params.startDate || '2026-11-12');
    const getDate = (o: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + o);
      return d.toISOString().split('T')[0];
    };
    const days: TripDay[] = [
      {
        dayNumber: 1,
        date: getDate(0),
        title: 'Asakusa Heritage & Tsukiji Culinary Craft',
        mysteryModeEnabled: false,
        revealedStopCount: 3,
        dailyBriefing: {
          vibeSummary:
            'Morning market flavors followed by Edo-period temple lanterns and digital art.',
          etiquetteTip:
            'Do not walk while eating in Tsukiji; finish snacks beside the vendor stall.',
          wearAdvice: 'Slip-on socks and shoes for temple interiors and teamLab.',
        },
        stops: [
          {
            id: `stop-tyo-1`,
            name: 'Tsukiji Outer Market Culinary Stalls',
            description:
              'Taste fresh tamagoyaki omelettes, seared tuna skewers, and matcha soft serve.',
            category: 'Food & Dining',
            startTime: '09:00',
            endTime: '11:00',
            durationMinutes: 120,
            travelFromPrevMinutes: 0,
            distanceFromPrevKm: 0,
            openingHours: '07:00-15:00',
            estimatedCost: 26,
            lat: 35.6655,
            lng: 139.7707,
            isIndoor: false,
            verifiedPlaceId: 'vp-tyo-1',
            mysteryClue:
              'Where Tokyo’s master chefs source sea urchin, dashi kelp, and sweet rolled omelettes at dawn.',
            upvotes: ['user-traveler-1'],
            downvotes: [],
            comments: [],
          },
          {
            id: `stop-tyo-2`,
            name: 'Senso-ji Temple & Nakamise Street',
            description:
              'Pass beneath the crimson Kaminarimon thunder gate to Tokyo’s oldest Buddhist temple.',
            category: 'History & Culture',
            startTime: '12:00',
            endTime: '14:00',
            durationMinutes: 120,
            travelFromPrevMinutes: 25,
            distanceFromPrevKm: 5.9,
            openingHours: '06:00-19:00',
            estimatedCost: 10,
            lat: 35.7148,
            lng: 139.7967,
            isIndoor: false,
            verifiedPlaceId: 'vp-tyo-2',
            mysteryClue:
              'A giant red paper lantern guards an incense cauldron and a five-story pagoda.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
          {
            id: `stop-tyo-3`,
            name: 'teamLab Planets Toyosu Digital Museum',
            description:
              'Walk barefoot through water-filled mirror rooms and suspended orchid gardens.',
            category: 'Art & Museums',
            startTime: '15:30',
            endTime: '17:30',
            durationMinutes: 120,
            travelFromPrevMinutes: 28,
            distanceFromPrevKm: 7.3,
            openingHours: '09:00-21:00',
            estimatedCost: 32,
            lat: 35.6491,
            lng: 139.7898,
            isIndoor: true,
            verifiedPlaceId: 'vp-tyo-3',
            mysteryClue:
              'Step barefoot into knee-deep glowing koi ponds that dissolve into starlight.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
        ],
      },
      {
        dayNumber: 2,
        date: getDate(1),
        title: 'Shinjuku Zen Gardens & Artisanal Coffee',
        mysteryModeEnabled: false,
        revealedStopCount: 2,
        dailyBriefing: {
          vibeSummary:
            'Tranquil maple pavilions balanced with Tokyo’s precision espresso and ramen scene.',
          etiquetteTip:
            'Keep phones on silent mode ("Manner Mode") inside commuter trains and gardens.',
          wearAdvice: 'Layered breathable cottons for garden paths.',
        },
        stops: [
          {
            id: `stop-tyo-4`,
            name: 'Shinjuku Gyoen National Garden',
            description:
              'Explore traditional Japanese landscape ponds, French formal sycamore alleys, and a historic Taiwan Pavilion.',
            category: 'Nature & Parks',
            startTime: '09:30',
            endTime: '12:00',
            durationMinutes: 150,
            travelFromPrevMinutes: 0,
            distanceFromPrevKm: 0,
            openingHours: '09:00-17:30',
            estimatedCost: 5,
            lat: 35.6852,
            lng: 139.71,
            isIndoor: false,
            verifiedPlaceId: 'vp-tyo-4',
            mysteryClue:
              'Fifty-eight hectares of imperial greenery sheltered beneath Shinjuku skyscrapers.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
          {
            id: `stop-tyo-5`,
            name: 'Omoide Yokocho & Shinjuku Craft Ramen',
            description:
              'Sample slow-simmered yuzu shio ramen and charcoal yakitori in historic lantern-lit alleys.',
            category: 'Food & Dining',
            startTime: '13:00',
            endTime: '15:00',
            durationMinutes: 120,
            travelFromPrevMinutes: 12,
            distanceFromPrevKm: 1.1,
            openingHours: '11:00-23:00',
            estimatedCost: 22,
            lat: 35.6929,
            lng: 139.6996,
            isIndoor: true,
            mysteryClue:
              'Narrow nostalgic alleyways where six-seat counters serve fragrant yuzu broth.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
        ],
      },
    ];
    return {
      destination: 'Tokyo',
      country: 'Japan',
      centerLat: 35.6762,
      centerLng: 139.6503,
      title: `Tokyo ${params.personality} Discovery`,
      days: groundAndEnrichDays(days, params.verifiedPlaces, 35.6762, 139.6503),
    };
  }

  // Paris or Custom Destination Fallback
  const isParis = destLower.includes('paris') || destLower.includes('france');
  const cityLabel = isParis ? 'Paris' : params.destination || 'Paris';
  const countryLabel = isParis ? 'France' : 'International';
  const cLat = isParis ? 48.8566 : 48.8566;
  const cLng = isParis ? 2.3522 : 2.3522;
  const baseDate = new Date(params.startDate || '2026-11-12');
  const getDate = (o: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + o);
    return d.toISOString().split('T')[0];
  };

  const days: TripDay[] = Array.from(
    { length: Math.max(1, Math.min(5, params.daysCount || 3)) },
    (_, i) => ({
      dayNumber: i + 1,
      date: getDate(i),
      title:
        i === 0
          ? `${cityLabel} Architectural Icons & Left Bank Bistros`
          : `${cityLabel} Artisanal Markets & Evening Promenade`,
      mysteryModeEnabled: false,
      revealedStopCount: 3,
      dailyBriefing: {
        vibeSummary: `Curated ${params.personality.toLowerCase()} pace blending cultural landmarks and neighborhood gastronomy.`,
        etiquetteTip:
          'Always greet shopkeepers and cafe hosts before asking a question.',
        wearAdvice: 'Smart-casual layers and comfortable leather walking shoes.',
      },
      stops: [
        {
          id: `stop-par-${i}-1`,
          name:
            i === 0
              ? 'Musee d Orsay Impressionist Gallery'
              : 'Sainte-Chapelle Royal Stained Glass',
          description:
            'Admire world-renowned masterpieces housed inside a monument of architectural heritage.',
          category: i === 0 ? 'Art & Museums' : 'History & Culture',
          startTime: '09:30',
          endTime: '11:30',
          durationMinutes: 120,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '09:30-18:00',
          estimatedCost: 18,
          lat: i === 0 ? 48.86 : 48.8554,
          lng: i === 0 ? 2.3266 : 2.345,
          isIndoor: true,
          verifiedPlaceId: i === 0 ? 'vp-par-1' : 'vp-par-4',
          mysteryClue:
            'Light streams through historic glass onto timeless works of art.',
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: `stop-par-${i}-2`,
          name: 'Marche des Enfants Rouges',
          description:
            'Savor freshly prepared regional specialties at the city’s oldest covered food market.',
          category: 'Food & Dining',
          startTime: '12:15',
          endTime: '14:00',
          durationMinutes: 105,
          travelFromPrevMinutes: 18,
          distanceFromPrevKm: 2.1,
          openingHours: '08:30-20:30',
          estimatedCost: 24,
          lat: 48.8628,
          lng: 2.362,
          isIndoor: true,
          verifiedPlaceId: 'vp-par-3',
          mysteryClue:
            'A hidden courtyard food market founded in 1615 tucked behind an iron gate.',
          upvotes: [],
          downvotes: [],
          comments: [],
        },
        {
          id: `stop-par-${i}-3`,
          name: 'Jardin du Luxembourg',
          description:
            'Relax beside the Medici Fountain and chestnut tree-lined promenades.',
          category: 'Nature & Parks',
          startTime: '14:45',
          endTime: '16:45',
          durationMinutes: 120,
          travelFromPrevMinutes: 16,
          distanceFromPrevKm: 2.4,
          openingHours: '07:30-20:30',
          estimatedCost: 0,
          lat: 48.8462,
          lng: 2.3372,
          isIndoor: false,
          verifiedPlaceId: 'vp-par-2',
          mysteryClue:
            'Green iron chairs encircle an octagonal basin where toy sailboats catch the breeze.',
          upvotes: [],
          downvotes: [],
          comments: [],
        },
      ],
    })
  );

  return {
    destination: cityLabel,
    country: countryLabel,
    centerLat: cLat,
    centerLng: cLng,
    title: `${cityLabel} ${params.personality} Getaway`,
    days: groundAndEnrichDays(days, params.verifiedPlaces, cLat, cLng),
  };
}

/**
 * Deterministic fallback mutation for Conversational Smart Re-planning
 * so that chat commands ALWAYS mutate the itinerary meaningfully even if offline/fallback.
 */
export function applyDeterministicChatReplan(
  trip: Trip,
  userMessage: string,
  verifiedPlaces: VerifiedPlace[]
): {
  assistantReply: string;
  diffSummary: string[];
  days: TripDay[];
} {
  const lower = userMessage.toLowerCase();
  const clonedDays: TripDay[] = JSON.parse(JSON.stringify(trip.days));
  const diffSummary: string[] = [];
  let assistantReply = '';

  // Case 1: Rainy Day / Indoor replacement
  if (lower.includes('rain') || lower.includes('indoor') || lower.includes('weather')) {
    const targetDayMatch = lower.match(/day\s*(\d+)/i);
    const targetDayNum = targetDayMatch ? parseInt(targetDayMatch[1], 10) : null;

    for (const day of clonedDays) {
      if (targetDayNum && day.dayNumber !== targetDayNum) continue;
      day.stops = day.stops.map((stop) => {
        if (!stop.isIndoor) {
          const oldName = stop.name;
          const indoorReplacement = {
            ...stop,
            name:
              trip.destination.toLowerCase().includes('istanbul')
                ? 'Turkish & Islamic Arts Museum (Ibrahim Pasha Palace)'
                : `${trip.destination} Covered Heritage Arcade & Tea Salon`,
            description:
              'Replaced outdoor stop with a sheltered, atmospheric indoor cultural venue with warm tea service.',
            category: 'Art & Museums' as StopCategory,
            isIndoor: true,
            estimatedCost: Math.min(stop.estimatedCost + 8, 24),
          };
          diffSummary.push(
            `Day ${day.dayNumber}: Replaced outdoor "${oldName}" with indoor "${indoorReplacement.name}"`
          );
          return indoorReplacement;
        }
        return stop;
      });
    }

    if (diffSummary.length === 0 && clonedDays[0]?.stops[0]) {
      clonedDays[0].stops[0].isIndoor = true;
      diffSummary.push(
        `Day 1: Verified all stops have covered indoor access for rainy weather`
      );
    }

    assistantReply = `I've updated the itinerary for rainy conditions by replacing exposed outdoor stops with sheltered indoor cultural venues and covered arcades while keeping your schedule and budget intact.`;
  }
  // Case 2: Make day less tiring / relaxed
  else if (
    lower.includes('less tiring') ||
    lower.includes('relax') ||
    lower.includes('slow') ||
    lower.includes('fewer')
  ) {
    const targetDayMatch = lower.match(/day\s*(\d+)/i);
    const targetDayNum = targetDayMatch ? parseInt(targetDayMatch[1], 10) : 2;
    const day =
      clonedDays.find((d) => d.dayNumber === targetDayNum) || clonedDays[0];
    if (day && day.stops.length > 2) {
      const removed = day.stops.pop()!;
      day.dailyBriefing.vibeSummary =
        'Re-paced for a restorative, unhurried rhythm with extra lingering time between stops.';
      if (day.stops[0]) {
        day.stops[0].startTime = '10:30';
        day.stops[0].endTime = '12:15';
      }
      diffSummary.push(
        `Day ${day.dayNumber}: Removed "${removed.name}" to reduce walking fatigue`
      );
      diffSummary.push(
        `Day ${day.dayNumber}: Shifted morning start to a relaxed 10:30 AM`
      );
      assistantReply = `I've lightened Day ${day.dayNumber} by removing "${removed.name}" and shifting your morning start to 10:30 AM so you have plenty of breathing room.`;
    } else {
      diffSummary.push(
        `Adjusted morning start time to 10:30 AM for a gentler pace`
      );
      assistantReply = `I've adjusted the schedule timings to give you a slower, more restorative pace.`;
    }
  }
  // Case 3: Swap museum / stop for a local food market
  else if (lower.includes('market') || lower.includes('food') || lower.includes('swap')) {
    const targetDayMatch = lower.match(/day\s*(\d+)/i);
    const targetDayNum = targetDayMatch ? parseInt(targetDayMatch[1], 10) : 1;
    const day =
      clonedDays.find((d) => d.dayNumber === targetDayNum) || clonedDays[0];
    if (day && day.stops.length > 0) {
      const targetIdx = day.stops.findIndex(
        (s) =>
          s.category === 'Art & Museums' || s.category === 'History & Culture'
      );
      const idx = targetIdx >= 0 ? targetIdx : 0;
      const oldStop = day.stops[idx];
      day.stops[idx] = {
        ...oldStop,
        name: trip.destination.toLowerCase().includes('istanbul')
          ? 'Besiktas Artisanal Food & Breakfast Market'
          : `${trip.destination} Old Quarter Gastronomic Market`,
        description:
          'Vibrant neighborhood market featuring honeycomb clotted cream, roasted chestnuts, artisan cheeses, and street delicacies.',
        category: 'Food & Dining',
        estimatedCost: 18,
        openingHours: '08:00-20:00',
        isIndoor: true,
      };
      diffSummary.push(
        `Day ${day.dayNumber}: Swapped "${oldStop.name}" for "${day.stops[idx].name}" ($18)`
      );
      assistantReply = `Done! I swapped "${oldStop.name}" on Day ${day.dayNumber} for "${day.stops[idx].name}" and recalculated your transit gaps.`;
    }
  }
  // Case 4: Reduce budget by 20%
  else if (lower.includes('budget') || lower.includes('cheap') || lower.includes('20%')) {
    for (const day of clonedDays) {
      for (const stop of day.stops) {
        if (stop.estimatedCost > 10) {
          const oldCost = stop.estimatedCost;
          stop.estimatedCost = Math.max(5, Math.round(oldCost * 0.75));
          diffSummary.push(
            `Day ${day.dayNumber}: Reduced "${stop.name}" cost from $${oldCost} to $${stop.estimatedCost} via local pass / off-peak entry`
          );
        }
      }
    }
    assistantReply = `I've optimized your itinerary for budget efficiency, trimming estimated stop costs by ~25% using museum pass bundles and neighborhood dining options.`;
  }
  // Case 5: Closed venue replacement or general instruction
  else {
    const day = clonedDays[0];
    if (day && day.stops.length > 0) {
      const lastIdx = day.stops.length - 1;
      const oldName = day.stops[lastIdx].name;
      day.stops[lastIdx] = {
        ...day.stops[lastIdx],
        name: trip.destination.toLowerCase().includes('istanbul')
          ? 'Pierre Loti Hill Cable Car & Golden Horn Tea House'
          : `${trip.destination} Panoramic Heritage Terrace`,
        description: `Updated stop tailored to your request: "${userMessage.slice(0, 80)}". Features verified opening hours and scenic views.`,
        openingHours: '08:30-22:30',
      };
      diffSummary.push(
        `Day ${day.dayNumber}: Replaced "${oldName}" with "${day.stops[lastIdx].name}"`
      );
      assistantReply = `I've updated Day ${day.dayNumber} by replacing "${oldName}" with "${day.stops[lastIdx].name}" and validated all opening hours and transit buffers.`;
    }
  }

  return {
    assistantReply,
    diffSummary,
    days: groundAndEnrichDays(
      clonedDays,
      verifiedPlaces,
      trip.centerLat,
      trip.centerLng
    ),
  };
}

export function buildDefaultPackingList(
  trip: Trip,
  weather: WeatherForecastDay[]
): PackingItem[] {
  const maxRain = Math.max(
    0,
    ...weather.map((w) => w.precipitationProbability)
  );
  const minTemp = Math.min(12, ...weather.map((w) => w.tempMinC));

  return [
    {
      id: 'pack-1',
      name:
        maxRain > 30
          ? 'Packable Waterproof Rain Shell'
          : 'Windproof Bosphorus Evening Jacket',
      category: 'Clothing',
      quantity: 1,
      reason: `Forecast shows up to ${maxRain}% rain probability and evening lows around ${minTemp}°C.`,
      packed: true,
    },
    {
      id: 'pack-2',
      name: 'Cushioned Cobblestone Walking Shoes',
      category: 'Clothing',
      quantity: 2,
      reason: 'Essential for historic hilly lanes in Sultanahmet and Galata.',
      packed: true,
    },
    {
      id: 'pack-3',
      name: 'Lightweight Cotton Scarf / Shawl',
      category: 'Clothing',
      quantity: 1,
      reason: 'Required etiquette for visiting Hagia Sophia and historic mosques.',
      packed: false,
    },
    {
      id: 'pack-4',
      name: 'Breathable Merino Base Layers',
      category: 'Clothing',
      quantity: 4,
      reason: `Ideal for ${trip.days.length}-day temperature swings between sunny afternoons and breezy ferry crossings.`,
      packed: false,
    },
    {
      id: 'pack-5',
      name: 'Passport + Digital e-Visa Backup',
      category: 'Documents & Money',
      quantity: 1,
      reason: 'International entry and museum ticket verification.',
      packed: true,
    },
    {
      id: 'pack-6',
      name: 'Zero-FX Fee Contactless Card & Local Cash',
      category: 'Documents & Money',
      quantity: 1,
      reason: 'Needed for topping up Istanbulkart ferry card and small spice stalls.',
      packed: true,
    },
    {
      id: 'pack-7',
      name: 'Universal Type C/F Power Adapter',
      category: 'Electronics',
      quantity: 1,
      reason: `Standard 230V two-prong European sockets used in ${trip.destination}.`,
      packed: false,
    },
    {
      id: 'pack-8',
      name: '10,000mAh USB-C Power Bank',
      category: 'Electronics',
      quantity: 1,
      reason: 'Keeps map navigation and camera charged during full-day excursions.',
      packed: true,
    },
    {
      id: 'pack-9',
      name: 'Blister Plasters & Electrolytes',
      category: 'Toiletries & Health',
      quantity: 1,
      reason: 'Prevents foot fatigue across 12,000+ daily steps.',
      packed: false,
    },
    {
      id: 'pack-10',
      name: 'Travel-Size Sunscreen SPF 50 & Lip Balm',
      category: 'Toiletries & Health',
      quantity: 1,
      reason: 'High UV reflection on open Bosphorus ferry decks and coastal parks.',
      packed: false,
    },
    {
      id: 'pack-11',
      name: 'Foldable Canvas Market Tote',
      category: 'Activity-Specific Gear',
      quantity: 1,
      reason: `Tailored for your ${trip.personality} stops at Spice Bazaar and Kadikoy Market.`,
      packed: false,
    },
    {
      id: 'pack-12',
      name: 'Compact Travel Umbrella',
      category: 'Activity-Specific Gear',
      quantity: 1,
      reason: `Backup shelter for ${maxRain}% forecast shower window.`,
      packed: false,
    },
  ];
}

export function buildDefaultWeatherForecast(startDate = '2026-11-12'): WeatherForecastDay[] {
  const base = new Date(startDate);
  const fmt = (o: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + o);
    return d.toISOString().split('T')[0];
  };
  return [
    {
      date: fmt(0),
      tempMaxC: 18,
      tempMinC: 11,
      precipitationProbability: 15,
      conditionSummary: 'Crisp sunshine with light Bosphorus breeze',
    },
    {
      date: fmt(1),
      tempMaxC: 19,
      tempMinC: 12,
      precipitationProbability: 20,
      conditionSummary: 'Partly cloudy, pleasant walking conditions',
    },
    {
      date: fmt(2),
      tempMaxC: 16,
      tempMinC: 10,
      precipitationProbability: 45,
      conditionSummary: 'Scattered afternoon coastal showers',
    },
    {
      date: fmt(3),
      tempMaxC: 18,
      tempMinC: 11,
      precipitationProbability: 10,
      conditionSummary: 'Clear golden skies',
    },
  ];
}

export function buildDefaultCompromiseResult(
  submissions: CompromiseSubmission[]
): CompromiseResult {
  return {
    summary:
      'Balanced Aria’s culinary market focus with Liam’s architectural photography and budget guardrails by pairing morning landmark visits with authentic, high-value neighborhood lokantas and waterfront parks.',
    fairnessScore: 94,
    resolutions: submissions.map((sub) => ({
      participantName: sub.userName,
      howWishWasIncluded:
        sub.role === 'traveler'
          ? `Honored "${sub.personalWish}" by anchoring Day 2 and Day 3 lunches around historic Spice Bazaar and Kadikoy culinary institutions.`
          : `Honored "${sub.personalWish}" by scheduling Golden Hour at Galata Tower, contemporary waterfront art at Karakoy, and keeping daily spend within $${sub.dailyBudgetComfort}/day.`,
      assignedStops:
        sub.role === 'traveler'
          ? [
              'Spice Bazaar (Misir Carsisi)',
              'Pandeli Restaurant above Spice Bazaar',
              'Ciya Sofrasi Anatolian Kitchen',
            ]
          : [
              'Hagia Sophia Grand Mosque',
              'Istanbul Modern Art Museum (Karakoy)',
              'Galata Tower Panoramic Deck',
            ],
    })),
    generatedAt: '2026-11-01T16:45:00Z',
  };
}

export function buildDefaultDiaryStory(
  trip: Trip,
  notes: DiaryMemoryNote[]
): DiaryStory {
  return {
    title: `Across Two Continents: Notes from ${trip.destination}`,
    subtitle: `A ${trip.days.length}-day ${trip.personality.toLowerCase()} chronicle of domes, spice vaults, and ferry wakes (${trip.startDate} – ${trip.endDate})`,
    narrativeMarkdown: `Morning light filtered through the high windows of Hagia Sophia as our journey in ${trip.destination} began. Between the echoing marble columns of the Basilica Cistern and the charcoal smoke of Sultanahmet’s oldest kofte grill, the first day set an unhurried, deeply sensory rhythm.\n\nBy the second afternoon, the scent of saffron and roasted pistachios in the Spice Bazaar gave way to turquoise Iznik tiles at Pandeli. Crossing the Galata Bridge as fishermen cast their lines into the Golden Horn, we watched sunset gild the Genoese stonework of Galata Tower.\n\n${
      notes.length > 0
        ? notes
            .map(
              (n) =>
                `At ${n.stopName} on Day ${n.dayNumber}, ${n.authorName} noted: "${n.caption}"`
            )
            .join('\n\n')
        : ''
    }\n\nTaking the commuter ferry across to Kadikoy on the Asian shore revealed the city’s everyday heartbeat—barrels of cured olives, Anatolian herb dishes at Ciya Sofrasi, and long twilight walks along the Moda seawall.`,
    highlights: [
      'Morning light inside Hagia Sophia and the subterranean Basilica Cistern',
      'Turquoise-tiled lunch at Pandeli above the 1664 Spice Bazaar',
      'Ferry crossing to Kadikoy Market & Anatolian feast at Ciya Sofrasi',
      'Golden hour over the Golden Horn from Galata Tower',
    ],
    closingReflection:
      'More than a checklist of monuments, this itinerary gave us the space to linger over tulip-glass tea and experience the living crossroads of Europe and Asia.',
    generatedAt: new Date().toISOString(),
  };
}

export function createSeedTrips(): Trip[] {
  const istanbulDays = buildIstanbulDays('2026-11-12', 'Foodie');
  const weather = buildDefaultWeatherForecast('2026-11-12');
  const submissions: CompromiseSubmission[] = [
    {
      id: 'sub-1',
      userId: 'user-traveler-1',
      userName: 'Aria Vance',
      role: 'traveler',
      mustHaveInterests: ['Food & Dining', 'Shopping & Markets'],
      preferredPace: 'Balanced',
      dailyBudgetComfort: 140,
      personalWish:
        'Must visit authentic Anatolian kitchens in Kadikoy and the historic Spice Bazaar without rushing meals.',
      submittedAt: '2026-11-01T15:10:00Z',
    },
    {
      id: 'sub-2',
      userId: 'user-buddy-1',
      userName: 'Liam Chen',
      role: 'buddy',
      mustHaveInterests: ['History & Culture', 'Art & Museums'],
      preferredPace: 'Relaxed',
      dailyBudgetComfort: 110,
      personalWish:
        'Want iconic Byzantine architecture, modern waterfront art, and sunset photography at Galata Tower within a modest budget.',
      submittedAt: '2026-11-01T15:30:00Z',
    },
  ];

  const diaryNotes: DiaryMemoryNote[] = [
    {
      id: 'diary-1',
      stopId: 'stop-ist-101',
      stopName: 'Hagia Sophia Grand Mosque',
      dayNumber: 1,
      authorName: 'Aria Vance',
      caption:
        'Standing beneath the 55-meter central dome right at opening—the shafts of morning sunlight were unforgettable.',
      photoDataUrl: 'svg:hagia_sophia',
      mood: 'Awestruck',
      createdAt: '2026-11-02T10:15:00Z',
    },
    {
      id: 'diary-2',
      stopId: 'stop-ist-202',
      stopName: 'Pandeli Restaurant above Spice Bazaar',
      dayNumber: 2,
      authorName: 'Liam Chen',
      caption:
        'Sea bass baked in parchment and smoky eggplant börek surrounded by shimmering turquoise tiles above the bazaar bustle.',
      photoDataUrl: 'svg:spice_bazaar',
      mood: 'Delighted',
      createdAt: '2026-11-02T14:30:00Z',
    },
    {
      id: 'diary-3',
      stopId: 'stop-ist-301',
      stopName: 'Kadikoy Produce & Fish Market',
      dayNumber: 3,
      authorName: 'Aria Vance',
      caption:
        'Tasting wildflower honeycomb and watching commuter ferries cross from Eminönü with seagulls trailing behind.',
      photoDataUrl: 'svg:bosphorus_ferry',
      mood: 'Inspired',
      createdAt: '2026-11-02T18:00:00Z',
    },
  ];

  const validation = validateTripSchedule({
    days: istanbulDays,
    totalBudget: 850,
    personality: 'Foodie',
    verifiedPlaces: SEED_VERIFIED_PLACES,
  });

  const trip1: Trip = {
    id: 'trip-istanbul-2026',
    title: 'Istanbul Bosphorus & Culinary Heritage',
    destination: 'Istanbul',
    country: 'Turkey',
    centerLat: 41.0082,
    centerLng: 28.9784,
    startDate: '2026-11-12',
    endDate: '2026-11-15',
    travelersCount: 2,
    totalBudget: 850,
    currency: 'USD',
    interests: [
      'Food & Dining',
      'History & Culture',
      'Shopping & Markets',
      'Art & Museums',
    ],
    personality: 'Foodie',
    inviteCode: 'IST-2026-89B',
    ownerId: 'user-traveler-1',
    collaboratorIds: ['user-buddy-1'],
    days: istanbulDays,
    actualExpenses: [
      {
        id: 'exp-1',
        title: 'Boutique Karakoy Hotel (3 Nights Deposit)',
        category: 'Accommodation',
        amount: 310,
        date: '2026-11-12',
        paidBy: 'Aria Vance',
        note: 'Includes rooftop breakfast overlooking the Bosphorus',
      },
      {
        id: 'exp-2',
        title: 'Hagia Sophia & Basilica Cistern Skip-the-Line Passes',
        category: 'Activities & Tickets',
        amount: 96,
        date: '2026-11-12',
        paidBy: 'Liam Chen',
        note: 'Combined entry for 2 travelers',
      },
      {
        id: 'exp-3',
        title: 'Sultanahmet Koftecisi & Pandeli Lunches',
        category: 'Food & Dining',
        amount: 108,
        date: '2026-11-13',
        paidBy: 'Aria Vance',
      },
      {
        id: 'exp-4',
        title: 'Istanbulkart Ferry & Tram Reloads',
        category: 'Transport',
        amount: 28,
        date: '2026-11-13',
        paidBy: 'Liam Chen',
      },
      {
        id: 'exp-5',
        title: 'Saffron, Sumac & Pistachio Lokum Boxes',
        category: 'Shopping & Misc',
        amount: 54,
        date: '2026-11-14',
        paidBy: 'Aria Vance',
      },
    ],
    packingList: [],
    weatherForecast: weather,
    compromiseSubmissions: submissions,
    compromiseResult: buildDefaultCompromiseResult(submissions),
    diaryNotes,
    diaryStory: undefined,
    chatHistory: [
      {
        id: 'chat-welcome',
        sender: 'assistant',
        authorName: 'AI Trip Planner',
        text: 'Welcome to your Istanbul Bosphorus & Culinary Heritage workspace. Every stop is grounded with verified coordinates and opening hours. Ask me to adjust any day—for example, "Make day 2 less tiring" or "It is raining on day 3, replace outdoor stops with indoor alternatives"—and I will update the live schedule directly.',
        timestamp: '2026-11-01T12:00:00Z',
        promptVersion: 'v2.3.1',
      },
    ],
    validation,
    updatedAt: '2026-11-02T19:00:00Z',
  };

  trip1.packingList = buildDefaultPackingList(trip1, weather);
  trip1.diaryStory = buildDefaultDiaryStory(trip1, diaryNotes);

  // Second seeded trip: Tokyo
  const tokyoTemplate = buildFallbackCityTemplate({
    destination: 'Tokyo',
    startDate: '2026-12-04',
    daysCount: 2,
    personality: 'Adventurer',
    verifiedPlaces: SEED_VERIFIED_PLACES,
  });
  const tokyoValidation = validateTripSchedule({
    days: tokyoTemplate.days,
    totalBudget: 1200,
    personality: 'Adventurer',
    verifiedPlaces: SEED_VERIFIED_PLACES,
  });

  const trip2: Trip = {
    id: 'trip-tokyo-2026',
    title: 'Tokyo Lantern Alleys & Digital Art',
    destination: 'Tokyo',
    country: 'Japan',
    centerLat: 35.6762,
    centerLng: 139.6503,
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    travelersCount: 2,
    totalBudget: 1200,
    currency: 'USD',
    interests: ['Food & Dining', 'Art & Museums', 'History & Culture'],
    personality: 'Adventurer',
    inviteCode: 'TYO-2026-44K',
    ownerId: 'user-traveler-1',
    collaboratorIds: ['user-buddy-1'],
    days: tokyoTemplate.days,
    actualExpenses: [
      {
        id: 'exp-tyo-1',
        title: 'Shinjuku Boutique Ryokan Stay',
        category: 'Accommodation',
        amount: 420,
        date: '2026-12-04',
        paidBy: 'Aria Vance',
      },
      {
        id: 'exp-tyo-2',
        title: 'Suica IC Transit Cards & Tsukiji Tasting',
        category: 'Food & Dining',
        amount: 85,
        date: '2026-12-04',
        paidBy: 'Liam Chen',
      },
    ],
    packingList: [],
    weatherForecast: buildDefaultWeatherForecast('2026-12-04'),
    compromiseSubmissions: [],
    diaryNotes: [],
    chatHistory: [
      {
        id: 'chat-tyo-1',
        sender: 'assistant',
        authorName: 'AI Trip Planner',
        text: 'Your Tokyo Adventurer itinerary is ready and verified against opening hours.',
        timestamp: '2026-11-02T09:00:00Z',
        promptVersion: 'v2.3.1',
      },
    ],
    validation: tokyoValidation,
    updatedAt: '2026-11-02T19:00:00Z',
  };
  trip2.packingList = buildDefaultPackingList(trip2, trip2.weatherForecast);

  return [trip1, trip2];
}

export const SEED_AI_LOGS: AiUsageLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-11-02T18:12:04Z',
    userId: 'user-traveler-1',
    userName: 'Aria Vance',
    feature: 'itinerary_generation',
    model: 'gemini-2.5-flash',
    promptVersion: 'v2.4.0',
    latencyMs: 1420,
    estimatedTokens: 1840,
    estimatedCostUsd: 0.0014,
    validationPassed: true,
    validationIssueCount: 0,
    status: 'success',
    promptSnippet:
      '4 days in Istanbul, relaxed food and history, medium budget ($850), Foodie personality',
  },
  {
    id: 'log-102',
    timestamp: '2026-11-02T18:25:19Z',
    userId: 'user-traveler-1',
    userName: 'Aria Vance',
    feature: 'packing_list',
    model: 'gemini-2.5-flash',
    promptVersion: 'v2.1.0',
    latencyMs: 980,
    estimatedTokens: 920,
    estimatedCostUsd: 0.0007,
    validationPassed: true,
    validationIssueCount: 0,
    status: 'success',
    promptSnippet:
      'Packing list for Istanbul (11°C–19°C, 45% coastal rain chance on Day 3)',
  },
  {
    id: 'log-103',
    timestamp: '2026-11-02T18:40:51Z',
    userId: 'user-buddy-1',
    userName: 'Liam Chen',
    feature: 'group_compromise',
    model: 'gemini-2.5-flash',
    promptVersion: 'v2.2.0',
    latencyMs: 1650,
    estimatedTokens: 2110,
    estimatedCostUsd: 0.0016,
    validationPassed: true,
    validationIssueCount: 0,
    status: 'success',
    promptSnippet:
      'Negotiate compromise between Aria Vance (Foodie, $140/d) and Liam Chen (Architecture, $110/d)',
  },
  {
    id: 'log-104',
    timestamp: '2026-11-02T19:02:11Z',
    userId: 'user-traveler-2',
    userName: 'Marcus Thorne',
    feature: 'chat_replan',
    model: 'gemini-2.5-flash',
    promptVersion: 'v2.3.1',
    latencyMs: 12,
    estimatedTokens: 0,
    estimatedCostUsd: 0,
    validationPassed: false,
    validationIssueCount: 0,
    status: 'blocked',
    promptSnippet: 'Blocked account attempt: automated scraping prompt',
    notes: 'Account restricted by Admin Elena Rostova',
  },
];
