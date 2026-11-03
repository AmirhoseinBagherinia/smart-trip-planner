import {
  AiUsageLog,
  CompromiseResult,
  CompromiseSubmission,
  DailyTransportPlan,
  DiaryMemoryNote,
  DiaryStory,
  PackingItem,
  RecommendedAccommodation,
  StopCategory,
  TravelPersonality,
  Trip,
  TripDay,
  TripStop,
  User,
  VerifiedPlace,
  WeatherForecastDay,
} from '../types.ts';
import {
  formatCurrency,
  getCurrencyRateFromUsd,
  getCurrencySymbol,
  getSuggestedTripBudget,
  roundCurrencyAmount,
} from '../utils/currency.ts';
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
  // Madrid
  {
    id: 'vp-mad-1',
    city: 'Madrid',
    country: 'Spain',
    name: 'Museo Nacional del Prado',
    category: 'Art & Museums',
    lat: 40.4138,
    lng: -3.6921,
    openingHours: '10:00-20:00',
    typicalCostUsd: 16,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-2',
    city: 'Madrid',
    country: 'Spain',
    name: 'Parque del Buen Retiro & Crystal Palace',
    category: 'Nature & Parks',
    lat: 40.4153,
    lng: -3.6845,
    openingHours: '06:00-22:00',
    typicalCostUsd: 0,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-3',
    city: 'Madrid',
    country: 'Spain',
    name: 'Palacio Real de Madrid (Royal Palace)',
    category: 'History & Culture',
    lat: 40.418,
    lng: -3.7143,
    openingHours: '10:00-19:00',
    typicalCostUsd: 18,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-4',
    city: 'Madrid',
    country: 'Spain',
    name: 'Mercado de San Miguel Tapas Hall',
    category: 'Food & Dining',
    lat: 40.4154,
    lng: -3.7089,
    openingHours: '10:00-23:30',
    typicalCostUsd: 26,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-5',
    city: 'Madrid',
    country: 'Spain',
    name: 'Plaza Mayor & Chocolateria San Gines',
    category: 'Food & Dining',
    lat: 40.4155,
    lng: -3.7074,
    openingHours: '08:00-23:00',
    typicalCostUsd: 12,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-6',
    city: 'Madrid',
    country: 'Spain',
    name: 'Museo Reina Sofia (Guernica Gallery)',
    category: 'Art & Museums',
    lat: 40.4079,
    lng: -3.6946,
    openingHours: '10:00-21:00',
    typicalCostUsd: 14,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-7',
    city: 'Madrid',
    country: 'Spain',
    name: 'Templo de Debod Sunset Mirador',
    category: 'History & Culture',
    lat: 40.424,
    lng: -3.7178,
    openingHours: '09:30-20:30',
    typicalCostUsd: 0,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-8',
    city: 'Madrid',
    country: 'Spain',
    name: 'Museo Nacional Thyssen-Bornemisza',
    category: 'Art & Museums',
    lat: 40.416,
    lng: -3.6949,
    openingHours: '10:00-19:00',
    typicalCostUsd: 15,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-mad-9',
    city: 'Madrid',
    country: 'Spain',
    name: 'Calle Cava Baja Tapas Walk (La Latina)',
    category: 'Food & Dining',
    lat: 40.412,
    lng: -3.7097,
    openingHours: '12:00-23:30',
    typicalCostUsd: 28,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
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
  {
    id: 'vp-rom-3',
    city: 'Rome',
    country: 'Italy',
    name: 'Colosseum & Roman Forum Archaeological Park',
    category: 'History & Culture',
    lat: 41.8902,
    lng: 12.4922,
    openingHours: '08:30-19:00',
    typicalCostUsd: 24,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'vp-rom-4',
    city: 'Rome',
    country: 'Italy',
    name: 'Galleria Borghese & Villa Gardens',
    category: 'Art & Museums',
    lat: 41.9142,
    lng: 12.4921,
    openingHours: '09:00-19:00',
    typicalCostUsd: 22,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  // Shiraz
  {
    id: 'vp-shz-1',
    city: 'Shiraz',
    country: 'Iran',
    name: 'Nasir al-Mulk Mosque (Pink Mosque)',
    category: 'History & Culture',
    lat: 29.6087,
    lng: 52.5484,
    openingHours: '07:30-17:00',
    typicalCostUsd: 8,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-shz-2',
    city: 'Shiraz',
    country: 'Iran',
    name: 'Eram Botanical Garden (Bagh-e Eram)',
    category: 'Nature & Parks',
    lat: 29.6358,
    lng: 52.5254,
    openingHours: '08:00-20:30',
    typicalCostUsd: 6,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-shz-3',
    city: 'Shiraz',
    country: 'Iran',
    name: 'Vakil Bazaar & Historic Caravanserai',
    category: 'Shopping & Markets',
    lat: 29.6152,
    lng: 52.5469,
    openingHours: '08:30-21:00',
    typicalCostUsd: 15,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'vp-shz-4',
    city: 'Shiraz',
    country: 'Iran',
    name: 'Tomb of Hafez (Hafezieh Pavilion)',
    category: 'History & Culture',
    lat: 29.6256,
    lng: 52.5583,
    openingHours: '08:00-22:30',
    typicalCostUsd: 3,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-22T10:00:00Z',
  },
  // Dehdasht (Kohgiluyeh and Boyer-Ahmad, Iran)
  {
    id: 'vp-deh-1',
    city: 'Dehdasht',
    country: 'Iran',
    name: 'Belad Shapur Historical Town (Belqeys Old Town)',
    category: 'History & Culture',
    lat: 30.7894,
    lng: 50.5612,
    openingHours: '07:30-19:30',
    typicalCostUsd: 2,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'vp-deh-2',
    city: 'Dehdasht',
    country: 'Iran',
    name: 'Safavid Caravanserai & Central Square',
    category: 'History & Culture',
    lat: 30.7925,
    lng: 50.5645,
    openingHours: '08:30-20:00',
    typicalCostUsd: 2,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'vp-deh-3',
    city: 'Dehdasht',
    country: 'Iran',
    name: 'Traditional Nomadic Bazaar & Local Kitchen',
    category: 'Food & Dining',
    lat: 30.796,
    lng: 50.568,
    openingHours: '09:00-21:30',
    typicalCostUsd: 4,
    isIndoor: true,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'vp-deh-4',
    city: 'Dehdasht',
    country: 'Iran',
    name: 'Chashmeh Belqeys Garden',
    category: 'Nature & Parks',
    lat: 30.7483,
    lng: 50.7455,
    openingHours: '07:00-19:30',
    typicalCostUsd: 2,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'vp-deh-5',
    city: 'Dehdasht',
    country: 'Iran',
    name: 'Dena Foothills Nature Trail',
    category: 'Nature & Parks',
    lat: 30.82,
    lng: 50.59,
    openingHours: '06:30-18:30',
    typicalCostUsd: 0,
    isIndoor: false,
    verifiedBy: 'Elena Rostova',
    updatedAt: '2026-10-25T10:00:00Z',
  },
];

interface CityBlueprint {
  destination: string;
  country: string;
  centerLat: number;
  centerLng: number;
  dayThemes: {
    title: string;
    vibe: string;
    etiquette: string;
    wear: string;
    stops: Array<{
      name: string;
      description: string;
      category: StopCategory;
      startTime: string;
      endTime: string;
      openingHours: string;
      estimatedCost: number;
      lat: number;
      lng: number;
      isIndoor: boolean;
      verifiedPlaceId?: string;
      mysteryClue: string;
    }>;
  }[];
}

const CITY_BLUEPRINTS: Record<string, CityBlueprint> = {
  madrid: {
    destination: 'Madrid',
    country: 'Spain',
    centerLat: 40.4168,
    centerLng: -3.7038,
    dayThemes: [
      {
        title: 'Paseo del Arte Masterpieces & Retiro Crystal Pavilion',
        vibe: 'Golden Triangle of Art galleries paired with sunlit rowboats and cast-iron market tapas.',
        etiquette: 'Lunch in Madrid typically begins after 13:30; greet tavern hosts with "Buenas".',
        wear: 'Supportive walking shoes for museum parquet floors and Retiro gravel avenues.',
        stops: [
          {
            name: 'Museo Nacional del Prado',
            description: 'Explore Velázquez’s Las Meninas, Goya’s Black Paintings, and El Bosco’s Garden of Earthly Delights.',
            category: 'Art & Museums',
            startTime: '09:30',
            endTime: '12:00',
            openingHours: '10:00-20:00',
            estimatedCost: 16,
            lat: 40.4138,
            lng: -3.6921,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-1',
            mysteryClue: 'Where royal canvases by Velázquez and Goya line neoclassical halls along the Paseo del Prado.',
          },
          {
            name: 'Casa Dani at Mercado de la Paz',
            description: 'Savor Madrid’s award-winning caramelized onion tortilla de patatas and Iberian ham croquetas.',
            category: 'Food & Dining',
            startTime: '12:30',
            endTime: '14:00',
            openingHours: '09:00-20:00',
            estimatedCost: 18,
            lat: 40.4275,
            lng: -3.6857,
            isIndoor: true,
            mysteryClue: 'An iron-framed 1882 neighborhood market in Salamanca famous for golden slices of Spanish tortilla.',
          },
          {
            name: 'Parque del Buen Retiro & Crystal Palace',
            description: 'Stroll beneath chestnut avenues to the 1887 glass-and-iron Palacio de Cristal beside a cypress lake.',
            category: 'Nature & Parks',
            startTime: '14:45',
            endTime: '17:00',
            openingHours: '06:00-22:00',
            estimatedCost: 0,
            lat: 40.4153,
            lng: -3.6845,
            isIndoor: false,
            verifiedPlaceId: 'vp-mad-2',
            mysteryClue: 'A soaring glass conservatory reflected in a tranquil park lagoon where turtles bask.',
          },
          {
            name: 'Circulo de Bellas Artes Azotea Rooftop',
            description: 'Watch twilight settle over Gran Vía and the Metropolis dome from the marble Minerva terrace.',
            category: 'Nightlife & Entertainment',
            startTime: '18:00',
            endTime: '19:45',
            openingHours: '10:00-23:30',
            estimatedCost: 15,
            lat: 40.4184,
            lng: -3.6966,
            isIndoor: false,
            mysteryClue: 'A bronze goddess of wisdom watches over the junction of Calle de Alcalá and Gran Vía.',
          },
        ],
      },
      {
        title: 'Habsburg Madrid: Royal Palace, Plaza Mayor & San Miguel Tapas',
        vibe: 'Grand Bourbon state rooms, arcaded seventeenth-century plazas, and artisanal vermouth.',
        etiquette: 'At bustling tapas counters, order at the bar and keep your napkin note for the final tally.',
        wear: 'Smart-casual layers and a light evening jacket for open-air plaza terraces.',
        stops: [
          {
            name: 'Palacio Real de Madrid (Royal Palace)',
            description: 'Tour the Throne Room, Stradivarius Royal Quartet hall, and Sabatini Gardens.',
            category: 'History & Culture',
            startTime: '10:00',
            endTime: '12:15',
            openingHours: '10:00-19:00',
            estimatedCost: 18,
            lat: 40.418,
            lng: -3.7143,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-3',
            mysteryClue: 'Three thousand sumptuous rooms of granite and marble crowning the western bluff of Madrid.',
          },
          {
            name: 'Mercado de San Miguel Tapas Hall',
            description: 'Sample Basque pintxos, Galician octopus, and Manchego cheese flights in a 1916 wrought-iron pavilion.',
            category: 'Food & Dining',
            startTime: '12:45',
            endTime: '14:15',
            openingHours: '10:00-23:30',
            estimatedCost: 26,
            lat: 40.4154,
            lng: -3.7089,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-4',
            mysteryClue: 'A bustling glass-and-iron culinary jewel box steps from the western arch of Plaza Mayor.',
          },
          {
            name: 'Plaza Mayor & Chocolateria San Gines',
            description: 'Admire the frescoed Casa de la Panadería and dip crisp churros into thick hot chocolate served since 1894.',
            category: 'Food & Dining',
            startTime: '15:00',
            endTime: '16:30',
            openingHours: '08:00-23:00',
            estimatedCost: 12,
            lat: 40.4155,
            lng: -3.7074,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-5',
            mysteryClue: 'Nine arched gateways lead into a crimson square followed by a narrow alleyway of hot chocolate.',
          },
          {
            name: 'Templo de Debod Sunset Mirador',
            description: 'Experience an authentic 2nd-century BC Egyptian temple gifted to Spain overlooking Casa de Campo.',
            category: 'History & Culture',
            startTime: '17:30',
            endTime: '19:00',
            openingHours: '09:30-20:30',
            estimatedCost: 0,
            lat: 40.424,
            lng: -3.7178,
            isIndoor: false,
            verifiedPlaceId: 'vp-mad-7',
            mysteryClue: 'Ancient Nubian sandstone portals mirrored in shallow pools above the Manzanares valley.',
          },
        ],
      },
      {
        title: 'Modernist Icons, Barrio de las Letras & La Latina Taverns',
        vibe: 'Picasso’s Guernica, literary cobblestone lanes, and centuries-old tavern hopping.',
        etiquette: 'When ordering a caña (small draft beer), a complimentary tapa is traditionally served alongside.',
        wear: 'Comfortable walking shoes for the sloped cobbled lanes of Lavapiés and La Latina.',
        stops: [
          {
            name: 'Museo Reina Sofia (Guernica Gallery)',
            description: 'Encounter Picasso’s monumental Guernica alongside works by Salvador Dalí and Joan Miró.',
            category: 'Art & Museums',
            startTime: '10:00',
            endTime: '12:15',
            openingHours: '10:00-21:00',
            estimatedCost: 14,
            lat: 40.4079,
            lng: -3.6946,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-6',
            mysteryClue: 'Glass elevator towers ascend a former 18th-century hospital housing Spain’s most famous anti-war canvas.',
          },
          {
            name: 'Barrio de las Letras & Casa Museo Lope de Vega',
            description: 'Walk brass-inscribed pavement quotes of Cervantes and Quevedo to a preserved 17th-century house.',
            category: 'History & Culture',
            startTime: '12:45',
            endTime: '14:15',
            openingHours: '10:00-18:00',
            estimatedCost: 8,
            lat: 40.4143,
            lng: -3.6975,
            isIndoor: true,
            mysteryClue: 'Golden Age verses are cast into the granite cobbles beneath your feet.',
          },
          {
            name: 'Calle Cava Baja Tapas Walk (La Latina)',
            description: 'Taste slow-braised oxtail (rabo de toro) and huevos rotos at Casa Lucio and historic posadas.',
            category: 'Food & Dining',
            startTime: '15:00',
            endTime: '17:00',
            openingHours: '12:00-23:30',
            estimatedCost: 28,
            lat: 40.412,
            lng: -3.7097,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-9',
            mysteryClue: 'Follow the curve of Madrid’s medieval Christian wall down a street of fifty traditional taverns.',
          },
        ],
      },
      {
        title: 'Thyssen Collection, Royal Botanical Gardens & Flamenco Tablao',
        vibe: 'European colorists, rare botanical conservatories, and intimate acoustic flamenco.',
        etiquette: 'Maintain quiet attentiveness during live flamenco cante and guitar solos.',
        wear: 'Evening attire for historic tablao performance.',
        stops: [
          {
            name: 'Museo Nacional Thyssen-Bornemisza',
            description: 'Trace eight centuries of Western painting from Renaissance portraits to Hopper and Van Gogh.',
            category: 'Art & Museums',
            startTime: '10:00',
            endTime: '12:00',
            openingHours: '10:00-19:00',
            estimatedCost: 15,
            lat: 40.416,
            lng: -3.6949,
            isIndoor: true,
            verifiedPlaceId: 'vp-mad-8',
            mysteryClue: 'Salmon-pink galleries inside the Villahermosa Palace bridge every chapter of art history.',
          },
          {
            name: 'Real Jardin Botanico de Madrid',
            description: 'Wander terraced eighteenth-century herbariums, bonsai collections, and romantic greenhouses.',
            category: 'Nature & Parks',
            startTime: '12:30',
            endTime: '14:15',
            openingHours: '10:00-19:00',
            estimatedCost: 6,
            lat: 40.4111,
            lng: -3.6911,
            isIndoor: false,
            mysteryClue: 'King Charles III’s enlightenment garden of exotic flora right next to the Prado.',
          },
          {
            name: 'Sobrino de Botin (Historic Castilian Roast)',
            description: 'Dine at the world’s oldest continuously operating restaurant (1725) on wood-fired Cochinillo.',
            category: 'Food & Dining',
            startTime: '14:45',
            endTime: '16:30',
            openingHours: '13:00-23:30',
            estimatedCost: 36,
            lat: 40.4142,
            lng: -3.708,
            isIndoor: true,
            mysteryClue: 'An oak-fired oven burning continuously since 1725 on Calle de Cuchilleros.',
          },
        ],
      },
      {
        title: 'Chamberi Sorolla Studio, Malasana Roasters & Gran Via Finale',
        vibe: 'Luminous Mediterranean canvases in an artist’s home garden and creative neighborhood cafes.',
        etiquette: 'Take time to enjoy sobremesa—lingering conversation over coffee after meals.',
        wear: 'Casual stylish daywear.',
        stops: [
          {
            name: 'Museo Sorolla & Andalusian Courtyard Garden',
            description: 'Visit Joaquín Sorolla’s preserved home studio filled with sunlit beach paintings and tiled fountains.',
            category: 'Art & Museums',
            startTime: '10:00',
            endTime: '12:00',
            openingHours: '09:30-20:00',
            estimatedCost: 8,
            lat: 40.4354,
            lng: -3.6925,
            isIndoor: true,
            mysteryClue: 'The master of Mediterranean light painted amidst marble fountains in Chamberí.',
          },
          {
            name: 'Mercado de San Anton (Chueca Rooftop Kitchen)',
            description: 'Sample artisanal charcuterie, vermouth on tap, and grilled seafood in a lively three-level market.',
            category: 'Food & Dining',
            startTime: '12:45',
            endTime: '14:30',
            openingHours: '10:00-23:00',
            estimatedCost: 24,
            lat: 40.422,
            lng: -3.6976,
            isIndoor: true,
            mysteryClue: 'A three-story gastronomic hub in Chueca crowned by a sunlit open-air terrace.',
          },
          {
            name: 'Plaza de Espana & Jardines de Sabatini Stroll',
            description: 'Admire the Cervantes monument and neoclassical palace parterres at golden hour.',
            category: 'Nature & Parks',
            startTime: '15:30',
            endTime: '17:30',
            openingHours: '07:00-22:00',
            estimatedCost: 0,
            lat: 40.4233,
            lng: -3.7121,
            isIndoor: false,
            mysteryClue: 'Don Quixote and Sancho Panza ride in bronze before olive trees and geometric hedges.',
          },
        ],
      },
    ],
  },
  shiraz: {
    destination: 'Shiraz',
    country: 'Iran',
    centerLat: 29.5918,
    centerLng: 52.5837,
    dayThemes: [
      {
        title: 'Kaleidoscope Morning Light, Vakil Bazaar & Zand Citadel',
        vibe: 'Stained-glass morning sunbeams, vaulted brick spice bazaars, and Zand-era architecture.',
        etiquette: 'Visit Nasir al-Mulk between 08:00 and 09:30 when low morning sunlight projects through the stained glass.',
        wear: 'Modest breathable cotton attire and slip-on walking shoes.',
        stops: [
          {
            name: 'Nasir al-Mulk Mosque (Pink Mosque)',
            description: 'Marvel at Persian carpets illuminated by rainbow stained-glass orosi windows and rose-painted muqarnas.',
            category: 'History & Culture',
            startTime: '08:30',
            endTime: '10:15',
            openingHours: '07:30-17:00',
            estimatedCost: 8,
            lat: 29.6087,
            lng: 52.5484,
            isIndoor: true,
            verifiedPlaceId: 'vp-shz-1',
            mysteryClue: 'Morning sunbeams turn twelve spiral stone columns and woven carpets into a living kaleidoscope.',
          },
          {
            name: 'Narenjestan Qavam Pavilion & Orange Courtyard',
            description: 'Explore mirror-mosaic halls (Ayeneh-kari) and sour orange orchards from the Qajar era.',
            category: 'History & Culture',
            startTime: '10:45',
            endTime: '12:15',
            openingHours: '08:00-19:00',
            estimatedCost: 7,
            lat: 29.6075,
            lng: 52.5508,
            isIndoor: true,
            mysteryClue: 'A nineteenth-century merchant pavilion framed by fragrant bitter-orange trees and mirror work.',
          },
          {
            name: 'Saray-e Mehr Traditional Courtyard Lunch',
            description: 'Dine on authentic Kalam Polo Shirazi (saffron rice with cabbage and herbs) and Shirazi salad.',
            category: 'Food & Dining',
            startTime: '12:45',
            endTime: '14:15',
            openingHours: '11:30-22:00',
            estimatedCost: 14,
            lat: 29.6155,
            lng: 52.5472,
            isIndoor: true,
            mysteryClue: 'Tucked inside a brick caravanserai where rosewater tea and saffron rice are served beside a pool.',
          },
          {
            name: 'Vakil Bazaar & Historic Caravanserai',
            description: 'Wander Karim Khan’s eighteenth-century vaulted brick arcades for spices, rugs, and inlaid khatam craft.',
            category: 'Shopping & Markets',
            startTime: '15:00',
            endTime: '17:00',
            openingHours: '08:30-21:00',
            estimatedCost: 15,
            lat: 29.6152,
            lng: 52.5469,
            isIndoor: true,
            verifiedPlaceId: 'vp-shz-3',
            mysteryClue: 'High brick vaults keep this Zand-era marketplace cool in summer and warm in winter.',
          },
        ],
      },
      {
        title: 'UNESCO Persian Gardens, Poetic Pavilions & Faloodeh',
        vibe: 'Cypress-lined water channels, classical Persian lyric poetry, and rosewater sorbet.',
        etiquette: 'Locals often recite verses quietly beside the alabaster tomb of Hafez at dusk.',
        wear: 'Comfortable walking shoes and sun protection for open garden avenues.',
        stops: [
          {
            name: 'Eram Botanical Garden (Bagh-e Eram)',
            description: 'Stroll beneath towering 300-year-old Sarv-e Naz cypresses and turquoise-tiled Qajar water pavilions.',
            category: 'Nature & Parks',
            startTime: '09:30',
            endTime: '11:30',
            openingHours: '08:00-20:30',
            typicalCostUsd: 6,
            estimatedCost: 6,
            lat: 29.6358,
            lng: 52.5254,
            isIndoor: false,
            verifiedPlaceId: 'vp-shz-2',
            mysteryClue: 'A UNESCO World Heritage paradise garden crowned by a three-story pavilion reflecting in a long pool.',
          } as any,
          {
            name: 'Haft Khan Culinary Complex',
            description: 'Enjoy charcoal-grilled lamb koobideh, pomegranate stew, and freshly baked sangak bread.',
            category: 'Food & Dining',
            startTime: '12:30',
            endTime: '14:15',
            openingHours: '11:30-23:00',
            estimatedCost: 18,
            lat: 29.6345,
            lng: 52.5612,
            isIndoor: true,
            mysteryClue: 'Named after the seven epic trials of Rostam in the Shahnameh near Quran Gate.',
          },
          {
            name: 'Tomb of Saadi (Saadieh Garden & Underground Spring)',
            description: 'Visit the octagonal lapis-tiled mausoleum of the master of Persian prose and poetry.',
            category: 'History & Culture',
            startTime: '15:00',
            endTime: '16:30',
            openingHours: '08:00-21:00',
            estimatedCost: 6,
            lat: 29.6226,
            lng: 52.5835,
            isIndoor: false,
            mysteryClue: 'Where the author of Bustan and Golestan rests beside a subterranean turquoise fish pond.',
          },
          {
            name: 'Tomb of Hafez (Hafezieh Pavilion) & Faloodeh Bastani',
            description: 'Experience twilight poetry recitations and sample frozen vermicelli noodles with rosewater and lime.',
            category: 'History & Culture',
            startTime: '17:15',
            endTime: '19:15',
            openingHours: '08:00-22:30',
            estimatedCost: 6,
            lat: 29.6256,
            lng: 52.5583,
            isIndoor: false,
            verifiedPlaceId: 'vp-shz-4',
            mysteryClue: 'Eight copper-domed columns shelter an alabaster inscription of ghazals under the evening stars.',
          },
        ],
      },
      {
        title: 'Arg-e Karim Khan Citadel, Pars Museum & Sang-e Siah Quarter',
        vibe: 'Leaning brick watchtowers, octagonal garden pavilions, and historic tea houses.',
        etiquette: 'Ask permission before photographing artisans in the historic Sang-e Siah alleys.',
        wear: 'Light daypack and sun hat.',
        stops: [
          {
            name: 'Arg of Karim Khan Zand Citadel',
            description: 'Explore the fortress walls, citrus courtyard, and royal bathhouse of the Zand dynasty founder.',
            category: 'History & Culture',
            startTime: '09:30',
            endTime: '11:30',
            openingHours: '08:00-19:30',
            estimatedCost: 8,
            lat: 29.618,
            lng: 52.5446,
            isIndoor: false,
            mysteryClue: 'Four circular brick bastion towers—one famously leaning—guard a citrus-scented inner court.',
          },
          {
            name: 'Pars Museum (Kolah Farangi Pavilion)',
            description: 'Admire Zand-era watercolor paintings and lacquerwork inside an octagonal garden pavilion.',
            category: 'Art & Museums',
            startTime: '12:00',
            endTime: '13:30',
            openingHours: '08:30-18:00',
            estimatedCost: 6,
            lat: 29.6169,
            lng: 52.5453,
            isIndoor: true,
            mysteryClue: 'An octagonal pavilion surrounded by cypresses housing Lotf Ali Khan’s artistic legacy.',
          },
          {
            name: 'Sharzeh Traditional Restaurant & Live Santur',
            description: 'Savor saffron tahchin rice cake and herb stews beside Vakil Mosque.',
            category: 'Food & Dining',
            startTime: '14:00',
            endTime: '15:45',
            openingHours: '12:00-22:30',
            estimatedCost: 16,
            lat: 29.6159,
            lng: 52.5461,
            isIndoor: true,
            mysteryClue: 'Brick arches echo with classical santur strings steps from Vakil Bathhouse.',
          },
        ],
      },
    ],
  },
  rome: {
    destination: 'Rome',
    country: 'Italy',
    centerLat: 41.9028,
    centerLng: 12.4964,
    dayThemes: [
      {
        title: 'Ancient Imperial Rome, Pantheon Oculus & Trastevere Trattorias',
        vibe: 'Travertine amphitheaters, second-century concrete domes, and Roman pasta classics.',
        etiquette: 'Cover shoulders and knees when entering basilicas; coperto (bread/table service) is standard at sit-down trattorias.',
        wear: 'Thick-soled walking shoes for ancient sampietrini basalt cobblestones.',
        stops: [
          {
            name: 'Colosseum & Roman Forum Archaeological Park',
            description: 'Walk the Via Sacra through triumphal arches, senate temples, and the Flavian Amphitheatre tiers.',
            category: 'History & Culture',
            startTime: '09:00',
            endTime: '11:45',
            openingHours: '08:30-19:00',
            estimatedCost: 24,
            lat: 41.8902,
            lng: 12.4922,
            isIndoor: false,
            verifiedPlaceId: 'vp-rom-3',
            mysteryClue: 'Eighty travertine arches where emperors and gladiators shaped the spectacle of antiquity.',
          },
          {
            name: 'Armando al Pantheon Roman Kitchen',
            description: 'Savor authentic tonnarelli cacio e pepe, rigatoni all’amatriciana, and Roman artichokes.',
            category: 'Food & Dining',
            startTime: '12:30',
            endTime: '14:00',
            openingHours: '12:00-22:30',
            estimatedCost: 32,
            lat: 41.8989,
            lng: 12.4762,
            isIndoor: true,
            mysteryClue: 'A family-run trattoria steps from Agrippa’s portico perfecting Roman pecorino and black pepper since 1961.',
          },
          {
            name: 'Pantheon & Piazza della Rotonda',
            description: 'Stand beneath Hadrian’s unreinforced concrete dome and its 9-meter open sky oculus.',
            category: 'History & Culture',
            startTime: '14:30',
            endTime: '16:00',
            openingHours: '09:00-19:00',
            estimatedCost: 10,
            lat: 41.8986,
            lng: 12.4769,
            isIndoor: true,
            verifiedPlaceId: 'vp-rom-1',
            mysteryClue: 'Sixteen monolithic Egyptian granite columns support the largest unreinforced concrete dome on earth.',
          },
          {
            name: 'Mercato Centrale & Trastevere Trattoria',
            description: 'Cross the Tiber to ivy-draped medieval piazzas for crispy supplì and wood-fired Roman pizza.',
            category: 'Food & Dining',
            startTime: '17:00',
            endTime: '19:00',
            openingHours: '10:00-23:00',
            estimatedCost: 28,
            lat: 41.8897,
            lng: 12.4695,
            isIndoor: true,
            verifiedPlaceId: 'vp-rom-2',
            mysteryClue: 'Across the Ponte Sisto where ochre alleys glow with trattoria lanterns.',
          },
        ],
      },
      {
        title: 'Bernini Sculptures at Villa Borghese, Spanish Steps & Trevi',
        vibe: 'Baroque marble movement, umbrella-pine parklands, and travertine fountains.',
        etiquette: 'Never sit on the travertine steps of Piazza di Spagna or wade in historic fountains.',
        wear: 'Smart-casual layers.',
        stops: [
          {
            name: 'Galleria Borghese & Villa Gardens',
            description: 'Admire Bernini’s Apollo and Daphne and Caravaggio’s dramatic canvases in Cardinal Scipione’s villa.',
            category: 'Art & Museums',
            startTime: '09:30',
            endTime: '11:45',
            openingHours: '09:00-19:00',
            estimatedCost: 22,
            lat: 41.9142,
            lng: 12.4921,
            isIndoor: true,
            verifiedPlaceId: 'vp-rom-4',
            mysteryClue: 'Carrara marble turns into laurel leaves and flowing drapery inside a seventeenth-century suburban villa.',
          },
          {
            name: 'Pincio Terrace & Piazza del Popolo',
            description: 'Gaze across the domes of Rome from Valadier’s neoclassical garden promenade.',
            category: 'Nature & Parks',
            startTime: '12:15',
            endTime: '13:30',
            openingHours: '07:00-22:00',
            estimatedCost: 0,
            lat: 41.9112,
            lng: 12.4789,
            isIndoor: false,
            mysteryClue: 'A lofty garden balcony overlooking twin baroque churches and an Egyptian obelisk.',
          },
          {
            name: 'Antico Caffe Greco & Via Condotti Espresso',
            description: 'Enjoy espresso and ricotta cannoli in Rome’s oldest literary café founded in 1760.',
            category: 'Food & Dining',
            startTime: '14:00',
            endTime: '15:30',
            openingHours: '09:00-20:30',
            estimatedCost: 18,
            lat: 41.9059,
            lng: 12.4809,
            isIndoor: true,
            mysteryClue: 'Red velvet banquettes where Keats, Goethe, and Casanova sipped coffee near the Spanish Steps.',
          },
          {
            name: 'Trevi Fountain & Piazza Navona Baroque Walk',
            description: 'Trace the Acqua Vergine aqueduct to Nicola Salvi’s Oceanus cascade and Bernini’s Four Rivers fountain.',
            category: 'History & Culture',
            startTime: '16:15',
            endTime: '18:15',
            openingHours: '06:00-23:59',
            estimatedCost: 0,
            lat: 41.9009,
            lng: 12.4833,
            isIndoor: false,
            mysteryClue: 'Follow the sound of rushing aqueduct water to a baroque palace facade carved like a sea cliff.',
          },
        ],
      },
      {
        title: 'Campo de Fiori Market, Capitoline Hill & Aventine Keyhole',
        vibe: 'Morning produce stalls, Michelangelo’s hilltop square, and secret citrus gardens.',
        etiquette: 'At traditional bakeries (forno), pizza bianca is sold by weight—specify the cut size.',
        wear: 'Comfortable walking footwear.',
        stops: [
          {
            name: 'Campo de Fiori & Antico Forno Roscioli',
            description: 'Sample warm rosemary pizza bianca, Roman supplì, and seasonal market fruit.',
            category: 'Shopping & Markets',
            startTime: '09:30',
            endTime: '11:15',
            openingHours: '07:30-18:00',
            estimatedCost: 16,
            lat: 41.8956,
            lng: 12.4722,
            isIndoor: false,
            mysteryClue: 'A vibrant morning market square steps from Rome’s most celebrated crust bakery.',
          },
          {
            name: 'Capitoline Museums & Forum Viewpoint',
            description: 'Explore the world’s oldest public museum designed by Michelangelo overlooking the Roman Forum.',
            category: 'Art & Museums',
            startTime: '11:45',
            endTime: '14:00',
            openingHours: '09:30-19:30',
            estimatedCost: 18,
            lat: 41.8931,
            lng: 12.4828,
            isIndoor: true,
            mysteryClue: 'Climb Michelangelo’s cordonata ramp to the bronze equestrian Marcus Aurelius.',
          },
          {
            name: 'Giardino degli Aranci & Aventine Keyhole',
            description: 'Peer through the Priory of Malta keyhole framing St. Peter’s Dome through clipped laurel hedges.',
            category: 'Nature & Parks',
            startTime: '15:00',
            endTime: '17:00',
            openingHours: '07:00-20:00',
            estimatedCost: 0,
            lat: 41.8829,
            lng: 12.4796,
            isIndoor: false,
            mysteryClue: 'A brass keyhole on the Aventine Hill aligns three sovereign states in a single glance.',
          },
        ],
      },
    ],
  },
  paris: {
    destination: 'Paris',
    country: 'France',
    centerLat: 48.8566,
    centerLng: 2.3522,
    dayThemes: [
      {
        title: 'Impressionist Left Bank, Sainte-Chapelle & Luxembourg Gardens',
        vibe: 'Beaux-Arts railway halls, radiant Gothic stained glass, and chestnut promenades.',
        etiquette: 'Always say "Bonjour" when entering any shop, bakery, or bistro.',
        wear: 'Chic layers and broken-in leather walking shoes.',
        stops: [
          {
            name: 'Musee d Orsay Impressionist Gallery',
            description: 'Admire Monet, Renoir, and Van Gogh masterpieces inside the 1900 Beaux-Arts railway station.',
            category: 'Art & Museums',
            startTime: '09:30',
            endTime: '11:45',
            openingHours: '09:30-18:00',
            estimatedCost: 18,
            lat: 48.86,
            lng: 2.3266,
            isIndoor: true,
            verifiedPlaceId: 'vp-par-1',
            mysteryClue: 'A giant gilded station clock overlooks the Seine and Impressionist brushstrokes.',
          },
          {
            name: 'Sainte-Chapelle Royal Stained Glass',
            description: 'Stand inside Louis IX’s thirteenth-century reliquary chapel ringed by 15-meter stained glass windows.',
            category: 'History & Culture',
            startTime: '12:30',
            endTime: '13:45',
            openingHours: '09:00-17:00',
            estimatedCost: 15,
            lat: 48.8554,
            lng: 2.345,
            isIndoor: true,
            verifiedPlaceId: 'vp-par-4',
            mysteryClue: 'Eleven hundred biblical scenes glow in ruby and cobalt glass on the Île de la Cité.',
          },
          {
            name: 'Le Comptoir du Relais Saint-Germain',
            description: 'Dine on classic duck confit, seasonal terrines, and sourdough tartines at an Odeon bistro.',
            category: 'Food & Dining',
            startTime: '14:15',
            endTime: '15:30',
            openingHours: '12:00-23:00',
            estimatedCost: 28,
            lat: 48.8522,
            lng: 2.3388,
            isIndoor: true,
            mysteryClue: 'An Art Deco brasserie terrace at the heart of the Carrefour de l’Odéon.',
          },
          {
            name: 'Jardin du Luxembourg',
            description: 'Unwind beside the Medici Fountain, orchard apiaries, and octagonal sailboat basin.',
            category: 'Nature & Parks',
            startTime: '16:00',
            endTime: '17:45',
            openingHours: '07:30-20:30',
            estimatedCost: 0,
            lat: 48.8462,
            lng: 2.3372,
            isIndoor: false,
            verifiedPlaceId: 'vp-par-2',
            mysteryClue: 'Green metal chairs surround a seventeenth-century Italianate grotto and palace basin.',
          },
        ],
      },
      {
        title: 'Le Marais Hôtels Particuliers, Covered Market & Montmartre Sunset',
        vibe: 'Aristocratic arcades, Paris’s oldest food market, and hilltop cobbles.',
        etiquette: 'Keep voices low in residential courtyards of the Marais.',
        wear: 'Comfortable footwear for Montmartre stairways.',
        stops: [
          {
            name: 'Place des Vosges & Maison de Victor Hugo',
            description: 'Walk beneath red-brick seventeenth-century arcades and visit Victor Hugo’s preserved apartment.',
            category: 'History & Culture',
            startTime: '10:00',
            endTime: '11:45',
            openingHours: '10:00-18:00',
            estimatedCost: 10,
            lat: 48.8556,
            lng: 2.3655,
            isIndoor: true,
            mysteryClue: 'Thirty-six symmetrical red-brick pavilions form Paris’s oldest planned royal square.',
          },
          {
            name: 'Marche des Enfants Rouges',
            description: 'Savor freshly prepared Moroccan tagines, buckwheat galettes, and organic cheeses at a 1615 market.',
            category: 'Food & Dining',
            startTime: '12:15',
            endTime: '14:00',
            openingHours: '08:30-20:30',
            estimatedCost: 24,
            lat: 48.8628,
            lng: 2.362,
            isIndoor: true,
            verifiedPlaceId: 'vp-par-3',
            mysteryClue: 'Tucked behind Rue de Bretagne, this 1615 courtyard is Paris’s oldest covered food market.',
          },
          {
            name: 'Musee de l Orangerie (Monet Water Lilies)',
            description: 'Experience Monet’s panoramic Nymphéas murals in two custom oval daylight rooms.',
            category: 'Art & Museums',
            startTime: '14:45',
            endTime: '16:30',
            openingHours: '09:00-18:00',
            estimatedCost: 14,
            lat: 48.8638,
            lng: 2.3226,
            isIndoor: true,
            mysteryClue: 'Two elliptical white sanctuaries at the edge of the Tuileries immerse you in willow-framed ponds.',
          },
          {
            name: 'Montmartre Vineyards & Sacre-Coeur Parvis',
            description: 'Stroll quiet Rue de l’Abreuvoir past the Clos Montmartre vineyard to panoramic twilight views.',
            category: 'Nature & Parks',
            startTime: '17:30',
            endTime: '19:15',
            openingHours: '06:00-22:30',
            estimatedCost: 0,
            lat: 48.8867,
            lng: 2.3431,
            isIndoor: false,
            mysteryClue: 'The highest natural hill in Paris crowned by travertine domes and a working vineyard.',
          },
        ],
      },
      {
        title: 'Louvre Courtyards, Palais-Royal Arcades & Canal Saint-Martin',
        vibe: 'Glass pyramids, nineteenth-century covered passages, and waterside bakeries.',
        etiquette: 'Book timed museum slots and keep to the right on metro escalators.',
        wear: 'Light trench coat or scarf.',
        stops: [
          {
            name: 'Louvre Museum Richelieu & Denon Wings',
            description: 'Explore the Winged Victory of Samothrace, Italian Renaissance halls, and Cour Marly sculptures.',
            category: 'Art & Museums',
            startTime: '09:30',
            endTime: '12:15',
            openingHours: '09:00-18:00',
            estimatedCost: 22,
            lat: 48.8606,
            lng: 2.3376,
            isIndoor: true,
            mysteryClue: 'A crystalline pyramid rises inside the courtyard of a medieval fortress turned palace.',
          },
          {
            name: 'Jardin du Palais-Royal & Galerie Vivienne',
            description: 'Walk through Buren’s striped courtyard columns to mosaic-floored 1823 shopping arcades.',
            category: 'Shopping & Markets',
            startTime: '12:45',
            endTime: '14:30',
            openingHours: '08:30-20:30',
            estimatedCost: 15,
            lat: 48.8649,
            lng: 2.3378,
            isIndoor: true,
            mysteryClue: 'Black-and-white striped columns lead to glass-roofed nineteenth-century bookshops.',
          },
          {
            name: 'Du Pain et des Idees & Canal Saint-Martin Walk',
            description: 'Taste pistachio-chocolate escargot pastries beside iron footbridges and canal locks.',
            category: 'Food & Dining',
            startTime: '15:30',
            endTime: '17:30',
            openingHours: '07:00-19:30',
            estimatedCost: 14,
            lat: 48.8712,
            lng: 2.3629,
            isIndoor: false,
            mysteryClue: 'An 1875 painted-ceiling boulangerie steps from tree-lined canal locks and iron footbridges.',
          },
        ],
      },
    ],
  },
  barcelona: {
    destination: 'Barcelona',
    country: 'Spain',
    centerLat: 41.3874,
    centerLng: 2.1686,
    dayThemes: [
      {
        title: 'Gaudi Modernisme, Boqueria Market & Gothic Quarter Lanes',
        vibe: 'Organic stone spires, stained glass forests, and Catalan market tapas.',
        etiquette: 'Reserve Sagrada Família entry in advance and watch belongings along Las Ramblas.',
        wear: 'Breathable Mediterranean layers and walking shoes.',
        stops: [
          {
            name: 'Basílica de la Sagrada Família',
            description: 'Experience Antoni Gaudí’s soaring branching columns and radiant stained-glass nave.',
            category: 'History & Culture',
            startTime: '09:30',
            endTime: '11:30',
            openingHours: '09:00-20:00',
            estimatedCost: 28,
            lat: 41.4036,
            lng: 2.1744,
            isIndoor: true,
            mysteryClue: 'Tree-like stone columns branch toward hyperboloid skylights in Eixample.',
          },
          {
            name: 'Mercat de la Boqueria & El Quim Tapas',
            description: 'Taste razor clams, baby squid with fried eggs, and Iberian acorn ham at historic market stalls.',
            category: 'Food & Dining',
            startTime: '12:15',
            endTime: '13:45',
            openingHours: '08:00-20:30',
            estimatedCost: 24,
            lat: 41.3817,
            lng: 2.1716,
            isIndoor: true,
            mysteryClue: 'A Modernista iron entrance off La Rambla opens onto vibrant Catalan food counters.',
          },
          {
            name: 'Barri Gotic & Placa del Rei',
            description: 'Explore Roman city walls, the medieval Palau Reial Major, and peaceful cathedral cloisters.',
            category: 'History & Culture',
            startTime: '14:30',
            endTime: '16:30',
            openingHours: '08:00-21:00',
            estimatedCost: 8,
            lat: 41.384,
            lng: 2.1762,
            isIndoor: false,
            mysteryClue: 'Labyrinthine medieval stone alleys where thirteen white geese guard a Gothic cloister.',
          },
        ],
      },
      {
        title: 'Park Guell Mosaic Terraces, Casa Batllo & El Born Wine Bars',
        vibe: 'Trencadís ceramic mosaics, dragon-scale rooftops, and medieval artisan streets.',
        etiquette: 'Catalan greetings ("Bon dia") are warmly appreciated across neighborhood cafés.',
        wear: 'Sun hat and comfortable shoes for Park Güell hills.',
        stops: [
          {
            name: 'Park Guell Monumental Zone',
            description: 'Admire the serpentine ceramic bench, Hypostyle Room, and Mediterranean skyline views.',
            category: 'Nature & Parks',
            startTime: '09:30',
            endTime: '11:30',
            openingHours: '09:30-19:30',
            estimatedCost: 14,
            lat: 41.4145,
            lng: 2.1527,
            isIndoor: false,
            mysteryClue: 'A multicolored mosaic salamander guards a hillside garden overlooking the sea.',
          },
          {
            name: 'Casa Batllo on Passeig de Gracia',
            description: 'Tour Gaudí’s marine-inspired townhome with bone-like balconies and an iridescent dragon roof.',
            category: 'Art & Museums',
            startTime: '12:15',
            endTime: '14:00',
            openingHours: '09:00-21:00',
            estimatedCost: 32,
            lat: 41.3917,
            lng: 2.1649,
            isIndoor: true,
            mysteryClue: 'A wave-curved stone facade crowned by ceramic scales along the Block of Discord.',
          },
          {
            name: 'El Xampanyet & Picasso Museum in El Born',
            description: 'Pair sparkling cava and anchovies with Picasso’s formative Barcelona masterpieces.',
            category: 'Food & Dining',
            startTime: '15:00',
            endTime: '17:30',
            openingHours: '12:00-22:30',
            estimatedCost: 26,
            lat: 41.3852,
            lng: 2.181,
            isIndoor: true,
            mysteryClue: 'Five connected medieval palaces on Carrer de Montcada next to a tiled 1929 cava bar.',
          },
        ],
      },
    ],
  },
  dehdasht: {
    destination: 'Dehdasht',
    country: 'Iran',
    centerLat: 30.7936,
    centerLng: 50.5647,
    dayThemes: [
      {
        title: 'Belad Shapur Old Town, Safavid Caravanserai, Nomadic Bazaar & Chashmeh Belqeys',
        vibe: 'Safavid stone arches in Belad Shapur, vaulted caravanserai courtyards, nomadic bazaar cuisine, and spring-fed Persian gardens.',
        etiquette: 'Greet local hosts warmly with "Salam" and accept complimentary mountain herbal tea (Chai-e Koohi).',
        wear: 'Comfortable walking shoes for the historic stone paths of Belad Shapur and Chashmeh Belqeys garden.',
        stops: [
          {
            name: 'Belad Shapur Historical Town (Belqeys Old Town)',
            description: 'Explore the 35-hectare Safavid historical city of Belad Shapur featuring ancient stone alleys, vaulted merchant chambers, and historic watchtowers.',
            category: 'History & Culture',
            startTime: '08:30',
            endTime: '10:30',
            openingHours: '07:30-19:30',
            estimatedCost: 2,
            lat: 30.7894,
            lng: 50.5612,
            isIndoor: false,
            verifiedPlaceId: 'vp-deh-1',
            mysteryClue: 'Thirty-five hectares of Safavid stone arches and merchant lanes preserved in Kohgiluyeh.',
          },
          {
            name: 'Safavid Caravanserai & Central Square',
            description: 'Tour the restored brick-and-stone Safavid caravanserai with 37 chambers, four symmetrical iwans, and the adjacent historic bathhouse.',
            category: 'History & Culture',
            startTime: '11:00',
            endTime: '12:30',
            openingHours: '08:30-20:00',
            estimatedCost: 2,
            lat: 30.7925,
            lng: 50.5645,
            isIndoor: true,
            verifiedPlaceId: 'vp-deh-2',
            mysteryClue: 'Where Silk Road and Persian Gulf trade caravans rested beneath four symmetrical brick iwans.',
          },
          {
            name: 'Traditional Nomadic Bazaar & Local Kitchen',
            description: 'Browse hand-knotted Lori Gabbeh rugs and savor authentic Ash-e Kardeh (wild mountain herb soup), oak-roasted lamb kebab, and fresh local doogh.',
            category: 'Food & Dining',
            startTime: '13:00',
            endTime: '15:00',
            openingHours: '09:00-21:30',
            estimatedCost: 4,
            lat: 30.796,
            lng: 50.568,
            isIndoor: true,
            verifiedPlaceId: 'vp-deh-3',
            mysteryClue: 'Vibrant geometric wool rugs and steaming bowls of wild Zagros herb soup in the central market.',
          },
          {
            name: 'Chashmeh Belqeys Garden',
            description: 'Unwind in the lush spring-fed botanical garden near Dehdasht/Cheram, ringed by walnut orchards, crystalline water channels, and mountain views.',
            category: 'Nature & Parks',
            startTime: '16:00',
            endTime: '18:15',
            openingHours: '07:00-19:30',
            estimatedCost: 2,
            lat: 30.7483,
            lng: 50.7455,
            isIndoor: false,
            verifiedPlaceId: 'vp-deh-4',
            mysteryClue: 'Natural karst mountain springs feed a circular paradise garden of citrus, myrtle, and walnut trees.',
          },
        ],
      },
      {
        title: 'Dena Foothills Nature Trail, Tang-e Pirzal Gorge & Boomgardi Feast',
        vibe: 'Panoramic Zagros mountain trails, emerald cypress springs, and traditional clay-pot Dizi hospitality.',
        etiquette: 'Keep natural spring waters clean and start your foothill walk in the crisp morning air.',
        wear: 'Sturdy trail sneakers or hiking sandals for the Dena foothills and Tang-e Pirzal gorge paths.',
        stops: [
          {
            name: 'Dena Foothills Nature Trail',
            description: 'Hike scenic oak-shaded foothills north of Dehdasht with sweeping vistas toward the Zagros ridges and wild pistachio groves.',
            category: 'Nature & Parks',
            startTime: '08:30',
            endTime: '10:45',
            openingHours: '06:30-18:30',
            estimatedCost: 0,
            lat: 30.82,
            lng: 50.59,
            isIndoor: false,
            verifiedPlaceId: 'vp-deh-5',
            mysteryClue: 'Ancient Zagros oak groves climb toward the limestone ridges of the Dena foothills.',
          },
          {
            name: 'Tang-e Pirzal Nature Gorge & Cypress Springs',
            description: 'Walk beside crystal-clear mountain springs, centuries-old cypress trees, and cool limestone canyon walls.',
            category: 'Nature & Parks',
            startTime: '11:30',
            endTime: '13:30',
            openingHours: '06:30-19:00',
            estimatedCost: 0,
            lat: 30.8415,
            lng: 50.618,
            isIndoor: false,
            mysteryClue: 'A lush Zagros canyon where cold mountain springs feed centuries-old oak and willow groves.',
          },
          {
            name: 'Kohgiluyeh Boomgardi Courtyard Kitchen (Dizi & Saffron Tahchin)',
            description: 'Enjoy slow-simmered stoneware Dizi (Abgoosht) with fresh basil, pickled garlic, and crispy saffron tahchin in a heritage courtyard.',
            category: 'Food & Dining',
            startTime: '14:15',
            endTime: '16:00',
            openingHours: '11:30-22:30',
            estimatedCost: 5,
            lat: 30.7985,
            lng: 50.5715,
            isIndoor: true,
            mysteryClue: 'Clay-pot stews simmered for six hours and served with hand-baked Tiri flatbread.',
          },
          {
            name: 'Saray-e Belad Shapur Evening Chai-Khaneh & Walnut Bakery',
            description: 'Sample warm local Tiri flatbread, wild mountain honey, walnut pastries, and cardamom tea in a lantern-lit courtyard.',
            category: 'Food & Dining',
            startTime: '17:00',
            endTime: '18:45',
            openingHours: '07:30-22:00',
            estimatedCost: 3,
            lat: 30.7865,
            lng: 50.5575,
            isIndoor: true,
            mysteryClue: 'Follow the aroma of wood-fired flatbread and wild Zagros thyme tea in historic Dehdasht.',
          },
        ],
      },
      {
        title: 'Marun River Valley Overlook, Historic Bathhouse & Farewell Feast',
        vibe: 'Turquoise canyon waters, Safavid stone architecture, and oak-grilled river trout.',
        etiquette: 'Ask permission before photographing local artisans and weavers.',
        wear: 'Breathable outdoor layers and camera gear.',
        stops: [
          {
            name: 'Marun River Valley & Zagros Foothill Overlook',
            description: 'Take in sweeping morning views across the turquoise Marun river valley and surrounding limestone ridges.',
            category: 'Nature & Parks',
            startTime: '09:00',
            endTime: '11:00',
            openingHours: '06:00-20:00',
            estimatedCost: 0,
            lat: 30.7785,
            lng: 50.542,
            isIndoor: false,
            mysteryClue: 'Where turquoise river waters wind through dramatic limestone ridges.',
          },
          {
            name: 'Dehdasht Historic Jameh Mosque & Stone Hammam',
            description: 'Examine centuries-old stone masonry, vaulted prayer halls, and traditional skylight bathhouse architecture.',
            category: 'History & Culture',
            startTime: '11:30',
            endTime: '13:00',
            openingHours: '08:00-19:00',
            estimatedCost: 2,
            lat: 30.791,
            lng: 50.5595,
            isIndoor: true,
            mysteryClue: 'Carved limestone arches and geometric skylights from the Safavid era.',
          },
          {
            name: 'Zagros Hearth Traditional Grill & Herb Platter',
            description: 'Feast on grilled river trout, mountain herb frittata (Kookoo Sabzi), and local pomegranate molasses.',
            category: 'Food & Dining',
            startTime: '13:30',
            endTime: '15:15',
            openingHours: '11:30-22:30',
            estimatedCost: 5,
            lat: 30.8035,
            lng: 50.574,
            isIndoor: true,
            mysteryClue: 'Fresh river trout grilled over oak embers with tangy local pomegranate sauce.',
          },
          {
            name: 'Imamzadeh Jaber Historic Courtyard & Terraced Orchards',
            description: 'Visit the peaceful historic courtyard and surrounding terraced fig and pomegranate orchards.',
            category: 'History & Culture',
            startTime: '16:00',
            endTime: '17:45',
            openingHours: '08:00-20:30',
            estimatedCost: 0,
            lat: 30.809,
            lng: 50.581,
            isIndoor: false,
            mysteryClue: 'A serene whitewashed dome nestled among foothill orchards.',
          },
        ],
      },
    ],
  },
  yasuj: {
    destination: 'Yasuj',
    country: 'Iran',
    centerLat: 30.6682,
    centerLng: 51.588,
    dayThemes: [
      {
        title: 'Yasuj Waterfall Canyon, Dena Foothills & Mountain Ash Kitchen',
        vibe: 'Crisp Zagros mountain air, cascading spring waterfalls, and warm Lori hospitality.',
        etiquette: 'Greet local families along the waterfall trails with a friendly nod and "Salam".',
        wear: 'Layered mountain clothing and gripped walking shoes.',
        stops: [
          {
            name: 'Yasuj Waterfall (Abshar-e Yasuj) & Walnut Valley',
            description: 'Walk shaded stone footpaths through walnut and plane tree orchards to the 10-meter natural spring waterfall.',
            category: 'Nature & Parks',
            startTime: '09:00',
            endTime: '11:30',
            openingHours: '07:00-21:00',
            estimatedCost: 1,
            lat: 30.6928,
            lng: 51.6152,
            isIndoor: false,
            mysteryClue: 'Snowmelt from the Dena peaks cascades down mossy cliffs framed by walnut orchards.',
          },
          {
            name: 'Dena Boomgardi Mountain Kitchen (Ash-e Kardeh & Kabab)',
            description: 'Dine on steaming bowls of Ash-e Kardeh, grilled lamb ribs, and local buttermilk on a mountain terrace.',
            category: 'Food & Dining',
            startTime: '12:15',
            endTime: '14:00',
            openingHours: '11:00-22:30',
            estimatedCost: 5,
            lat: 30.6745,
            lng: 51.596,
            isIndoor: true,
            mysteryClue: 'Woven Lori kilims line a wooden terrace overlooking the green valleys of Boyer-Ahmad.',
          },
          {
            name: ' Yasuj Forest Park (Park-e Jangali) Panoramic Ridge',
            description: 'Enjoy sunset views over the city of Yasuj and the snow-dusted Dena mountain range.',
            category: 'Nature & Parks',
            startTime: '15:00',
            endTime: '17:30',
            openingHours: '06:30-22:00',
            estimatedCost: 0,
            lat: 30.6812,
            lng: 51.6045,
            isIndoor: false,
            mysteryClue: 'An oak-forested ridge rising directly above the capital of Kohgiluyeh and Boyer-Ahmad.',
          },
        ],
      },
      {
        title: 'Tang-e Tamoradi Waterfalls, Bashar River & Local Handicrafts',
        vibe: 'Dramatic limestone gorges, turquoise river pools, and tribal weaving.',
        etiquette: 'Respect local picnic areas along the Bashar River.',
        wear: 'Outdoor walking shoes and sun protection.',
        stops: [
          {
            name: 'Tang-e Tamoradi Gorge & Four Waterfalls',
            description: 'Explore the dramatic canyon southwest of Yasuj where four seasonal waterfalls plunge into limestone pools.',
            category: 'Nature & Parks',
            startTime: '09:00',
            endTime: '12:00',
            openingHours: '07:00-19:00',
            estimatedCost: 1,
            lat: 30.5412,
            lng: 51.4215,
            isIndoor: false,
            mysteryClue: 'A legendary Zagros gorge where four silver cascades echo against sheer canyon walls.',
          },
          {
            name: 'Bashar Riverbank Trout & Oak-Fired Bread Lunch',
            description: 'Taste fresh cold-water rainbow trout grilled beside the Bashar River with mountain herbs.',
            category: 'Food & Dining',
            startTime: '12:45',
            endTime: '14:30',
            openingHours: '11:30-21:30',
            estimatedCost: 5,
            lat: 30.659,
            lng: 51.579,
            isIndoor: false,
            mysteryClue: 'Riverside pavilions serving freshly caught mountain trout and wild leek bread.',
          },
          {
            name: 'Yasuj Traditional Bazaar & Jajim Weaving Stalls',
            description: 'Discover colorful hand-woven Jajim textiles, mountain honey, and dried Dena herbs.',
            category: 'Shopping & Markets',
            startTime: '15:30',
            endTime: '17:30',
            openingHours: '09:00-21:00',
            estimatedCost: 4,
            lat: 30.6665,
            lng: 51.5865,
            isIndoor: true,
            mysteryClue: 'Brightly striped wool textiles and jars of wild astragalus honey.',
          },
        ],
      },
    ],
  },
  kashan: {
    destination: 'Kashan',
    country: 'Iran',
    centerLat: 33.985,
    centerLng: 51.41,
    dayThemes: [
      {
        title: 'Fin Persian Garden, Tabatabaei House & Rosewater Heritage',
        vibe: 'Turquoise qanat water channels, Qajar stained-glass windcatchers, and fragrant rosewater.',
        etiquette: 'Speak softly inside the historic courtyard houses.',
        wear: 'Breathable cotton attire and comfortable slip-on shoes.',
        stops: [
          {
            name: 'Fin Persian Garden (Bagh-e Fin UNESCO Site)',
            description: 'Walk beside natural spring-fed turquoise pools and centuries-old cypresses in Iran’s oldest extant Persian garden.',
            category: 'Nature & Parks',
            startTime: '09:00',
            endTime: '11:00',
            openingHours: '08:00-19:00',
            estimatedCost: 3,
            lat: 33.9464,
            lng: 51.3722,
            isIndoor: false,
            mysteryClue: 'Where the Soleymanieh spring feeds hundreds of gravity-powered fountains beneath ancient cypresses.',
          },
          {
            name: 'Abbasi Traditional Courtyard Restaurant (Goosht-e Loobia)',
            description: 'Dine on Kashan’s signature Goosht-e Loobia (slow-cooked lamb and bean stew with fragrant rice) beside a sunken garden.',
            category: 'Food & Dining',
            startTime: '12:00',
            endTime: '13:45',
            openingHours: '11:30-22:30',
            estimatedCost: 5,
            lat: 33.9742,
            lng: 51.4388,
            isIndoor: true,
            mysteryClue: 'A restored Qajar mansion serving saffron-scented Kashani stews on cushioned takht beds.',
          },
          {
            name: 'Tabatabaei & Borujerdi Historical Houses',
            description: 'Marvel at intricate stucco reliefs, windcatchers (badgirs), and stained-glass courtyard halls.',
            category: 'History & Culture',
            startTime: '14:15',
            endTime: '16:30',
            openingHours: '08:00-19:30',
            estimatedCost: 3,
            lat: 33.9748,
            lng: 51.4392,
            isIndoor: true,
            mysteryClue: 'Designed by Ustad Ali Maryam with frescoes by Royal Painter Kamal-ol-Molk.',
          },
          {
            name: 'Sultan Amir Ahmad Bathhouse & Rooftop Domes',
            description: 'Climb to the sculpted turquoise-and-ochre lens domes for golden hour views over historic Kashan.',
            category: 'History & Culture',
            startTime: '17:00',
            endTime: '18:30',
            openingHours: '08:00-20:00',
            estimatedCost: 3,
            lat: 33.9736,
            lng: 51.4379,
            isIndoor: true,
            mysteryClue: 'Clustered convex glass domes filter desert sunlight into a sixteenth-century bathhouse below.',
          },
        ],
      },
      {
        title: 'Kashan Grand Bazaar, Amin al-Dowleh Timcheh & Agha Bozorg Mosque',
        vibe: 'Soaring brick muqarnas vaults, copper smiths, and symmetrical sunken courtyard architecture.',
        etiquette: 'Pause under the central skylight of Timcheh-ye Amin al-Dowleh for tea.',
        wear: 'Light walking footwear.',
        stops: [
          {
            name: 'Kashan Historic Bazaar & Timcheh-ye Amin al-Dowleh',
            description: 'Gaze up at the towering 19th-century painted brick muqarnas vault above handmade carpet merchants.',
            category: 'Shopping & Markets',
            startTime: '09:30',
            endTime: '11:45',
            openingHours: '08:30-20:00',
            estimatedCost: 2,
            lat: 33.9872,
            lng: 51.4465,
            isIndoor: true,
            mysteryClue: 'A three-story caravanserai dome cellularly carved like a celestial honeycomb.',
          },
          {
            name: 'Mozaffari Traditional Tea House & Saffron Ice Cream',
            description: 'Enjoy rosewater-and-pistachio bastani ice cream, cardamom tea, and local Kashan baklava.',
            category: 'Food & Dining',
            startTime: '12:15',
            endTime: '13:45',
            openingHours: '10:00-21:00',
            estimatedCost: 3,
            lat: 33.9865,
            lng: 51.4458,
            isIndoor: true,
            mysteryClue: 'Tucked beneath the bazaar vaults where Mohammadi rosewater perfumes every cup.',
          },
          {
            name: 'Agha Bozorg Mosque & Sunken Madrasa',
            description: 'Admire the two-level symmetrical courtyard, twin minarets, and windcatcher cooling towers.',
            category: 'History & Culture',
            startTime: '14:30',
            endTime: '16:30',
            openingHours: '08:00-19:30',
            estimatedCost: 0,
            lat: 33.9788,
            lng: 51.4441,
            isIndoor: false,
            mysteryClue: 'A nineteenth-century architectural masterpiece built around a sunken garden seminary.',
          },
        ],
      },
    ],
  },
  mombasa: {
    destination: 'Mombasa',
    country: 'Kenya',
    centerLat: -4.0435,
    centerLng: 39.6682,
    dayThemes: [
      {
        title: 'Fort Jesus UNESCO Ramparts, Swahili Old Town & Tamarind Dhow',
        vibe: 'Sixteenth-century coral-stone ramparts, carved Zanzibar doors, and Indian Ocean spices.',
        etiquette: 'Greet locals with "Jambo" or the coastal Swahili greeting "Shikamoo".',
        wear: 'Breathable linen clothing and sandals suitable for coastal humidity.',
        stops: [
          {
            name: 'Fort Jesus UNESCO Museum & Coral Ramparts',
            description: 'Explore the 1593 Portuguese and Omani coral-rock fortress overlooking the Old Mombasa Harbor.',
            category: 'History & Culture',
            startTime: '09:00',
            endTime: '11:15',
            openingHours: '08:00-18:00',
            estimatedCost: 12,
            lat: -4.0628,
            lng: 39.6797,
            isIndoor: false,
            mysteryClue: 'Designed in the shape of a Renaissance human figure carved into coastal coral rock.',
          },
          {
            name: 'Forodhani Swahili Seafront Restaurant (Pilau & Coconut Fish)',
            description: 'Savor coastal Swahili fish curry simmered in coconut milk (Samaki wa Kupaka) and spiced pilau.',
            category: 'Food & Dining',
            startTime: '12:00',
            endTime: '13:45',
            openingHours: '11:00-22:00',
            estimatedCost: 10,
            lat: -4.0612,
            lng: 39.6788,
            isIndoor: false,
            mysteryClue: 'Oceanfront terrace where dhows sail past and cardamom-spiced rice meets fresh Indian Ocean catch.',
          },
          {
            name: 'Mombasa Old Town & Marikiti Spice Market Walk',
            description: 'Wander narrow streets lined with ornate carved teak balconies and fragrant clove, cinnamon, and tamarind stalls.',
            category: 'Shopping & Markets',
            startTime: '14:30',
            endTime: '16:30',
            openingHours: '08:00-19:00',
            estimatedCost: 6,
            lat: -4.0585,
            lng: 39.6745,
            isIndoor: false,
            mysteryClue: 'Brass-studded doors and aromatic sacks of Zanzibar cloves andahili coffee.',
          },
        ],
      },
      {
        title: 'Haller Park Sanctuary, Mama Ngina Waterfront & Nyali Beach',
        vibe: 'Restored coastal forest wildlife, baobab groves, and crispy cassava crisps by the channel.',
        etiquette: 'Keep a respectful distance when feeding Rothschild giraffes at Haller Park.',
        wear: 'Sun hat, sunglasses, and light walking shoes.',
        stops: [
          {
            name: 'Haller Park Coastal Nature Sanctuary',
            description: 'Walk shaded casuarina trails past giant Aldabra tortoises, giraffes, and hippos in a reclaimed quarry oasis.',
            category: 'Nature & Parks',
            startTime: '09:00',
            endTime: '11:30',
            openingHours: '08:00-17:30',
            estimatedCost: 14,
            lat: -4.0125,
            lng: 39.7192,
            isIndoor: false,
            mysteryClue: 'A former limestone quarry transformed into a lush tropical sanctuary of giant tortoises and giraffes.',
          },
          {
            name: 'Blue Room Mombasa (Historic Viazi Karai & Bhajia Lunch)',
            description: 'Taste Mombasa’s iconic crispy spiced potato Viazi Karai with tangy tamarind sauce and fresh passion juice.',
            category: 'Food & Dining',
            startTime: '12:30',
            endTime: '14:00',
            openingHours: '08:00-21:00',
            estimatedCost: 8,
            lat: -4.0542,
            lng: 39.6675,
            isIndoor: true,
            mysteryClue: 'A beloved coastal institution on Haile Selassie Avenue famous since the 1950s.',
          },
          {
            name: 'Mama Ngina Waterfront & Likoni Channel Sunset Walk',
            description: 'Stroll beneath ancient baobab trees watching ocean liners and ferries cross the Kilindini harbor entrance.',
            category: 'Nature & Parks',
            startTime: '16:00',
            endTime: '18:00',
            openingHours: '06:00-22:00',
            estimatedCost: 2,
            lat: -4.0752,
            lng: 39.6712,
            isIndoor: false,
            mysteryClue: 'Ancient coastal baobabs frame the deep-water channel where spiced cassava crisps are roasted.',
          },
        ],
      },
    ],
  },
};

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
      title: 'Sultanahmet Imperial Spires & Subterranean Marvels',
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
        },
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
    {
      dayNumber: 5,
      date: getDateStr(4),
      title: 'Ortakoy Waterfront, Dolmabahce Grandeur & Bebek Bay',
      mysteryModeEnabled: false,
      revealedStopCount: 3,
      dailyBriefing: {
        vibeSummary:
          'Bosphorus palace architecture paired with waterfront waffles and scenic strait strolls.',
        etiquetteTip:
          'Photography is restricted inside Dolmabahce Palace state halls.',
        wearAdvice: 'Smart-casual layers for Bosphorus waterfront dining.',
      },
      stops: [
        {
          id: 'stop-ist-501',
          name: 'Dolmabahce Palace Crystal Staircase & Bosphorus Gates',
          description:
            'Tour the 19th-century waterfront palace featuring Bohemian crystal chandeliers and ornate ceremonial gates.',
          category: 'History & Culture',
          startTime: '09:30',
          endTime: '12:00',
          durationMinutes: 150,
          travelFromPrevMinutes: 0,
          distanceFromPrevKm: 0,
          openingHours: '09:00-17:00',
          estimatedCost: 36,
          lat: 41.0392,
          lng: 29.0007,
          isIndoor: true,
          mysteryClue: 'Ornate white marble sea-gates open directly onto the Bosphorus currents in Besiktas.',
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-502',
          name: 'Ortakoy Square Kumpir & Waterfront Mosque',
          description:
            'Enjoy baked kumpir potatoes and freshly griddled waffles beside the neo-baroque Ortakoy Mosque beneath the Bosphorus Bridge.',
          category: 'Food & Dining',
          startTime: '12:45',
          endTime: '14:30',
          durationMinutes: 105,
          travelFromPrevMinutes: 14,
          distanceFromPrevKm: 2.3,
          openingHours: '09:00-23:00',
          estimatedCost: 16,
          lat: 41.0472,
          lng: 29.0277,
          isIndoor: false,
          mysteryClue: 'Where a jewel-like baroque mosque stands directly beneath the suspension bridge spanning Europe and Asia.',
          isCompleted: false,
          upvotes: [],
          downvotes: [],
          comments: [],
        },
        {
          id: 'stop-ist-503',
          name: 'Bebek Park & Almond Paste Confectionery',
          description:
            'Walk the yacht-lined Bebek bay promenade and sample artisanal marzipan (badem ezmesi) established in 1904.',
          category: 'Nature & Parks',
          startTime: '15:15',
          endTime: '17:30',
          durationMinutes: 135,
          travelFromPrevMinutes: 16,
          distanceFromPrevKm: 3.4,
          openingHours: '08:00-22:00',
          estimatedCost: 12,
          lat: 41.0772,
          lng: 29.0439,
          isIndoor: false,
          mysteryClue: 'A sheltered Bosphorus cove famous since 1904 for handcrafted pistachio and almond confections.',
          isCompleted: false,
          upvotes: [],
          downvotes: [],
          comments: [],
        },
      ],
    },
  ];

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

/**
 * Resolves any destination city via OpenStreetMap Nominatim when not in our built-in blueprints
 * so that coordinates and POIs match the exact city requested by the user.
 */
export async function resolveDynamicCityCoordinates(destination: string): Promise<{
  city: string;
  country: string;
  lat: number;
  lng: number;
  pois: Array<{ name: string; lat: number; lng: number; category: StopCategory }>;
}> {
  const cleanCity = destination.trim() || 'Madrid';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanCity
    )}&format=json&addressdetails=1&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SmartTripPlanner/2.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const top = data[0];
        const lat = Number(parseFloat(top.lat).toFixed(5));
        const lng = Number(parseFloat(top.lon).toFixed(5));
        const country =
          top.address?.country ||
          String(top.display_name || '').split(',').pop()?.trim() ||
          'International';

        // Also query real museums/landmarks/parks in that city bounding box
        const pois: Array<{
          name: string;
          lat: number;
          lng: number;
          category: StopCategory;
        }> = [];
        try {
          const poiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            `museum in ${cleanCity}`
          )}&format=json&limit=8`;
          const poiRes = await fetch(poiUrl, {
            headers: { 'User-Agent': 'SmartTripPlanner/2.0' },
          });
          if (poiRes.ok) {
            const poiList: any = await poiRes.json();
            if (Array.isArray(poiList)) {
              for (const item of poiList) {
                const pName = String(item.name || item.display_name?.split(',')[0] || '').trim();
                if (pName && !pois.some((x) => x.name === pName)) {
                  pois.push({
                    name: pName,
                    lat: Number(parseFloat(item.lat).toFixed(5)),
                    lng: Number(parseFloat(item.lon).toFixed(5)),
                    category: 'Art & Museums',
                  });
                }
              }
            }
          }
        } catch {
          // Ignore secondary POI lookup error
        }

        return { city: cleanCity, country, lat, lng, pois };
      }
    }
  } catch {
    // Fallback to known coordinate lookup table
  }

  const KNOWN_COORDS: Record<string, { country: string; lat: number; lng: number }> = {
    dehdasht: { country: 'Iran', lat: 30.7936, lng: 50.5647 },
    yasuj: { country: 'Iran', lat: 30.6682, lng: 51.588 },
    kashan: { country: 'Iran', lat: 33.985, lng: 51.41 },
    shiraz: { country: 'Iran', lat: 29.5918, lng: 52.5837 },
    isfahan: { country: 'Iran', lat: 32.6546, lng: 51.668 },
    yazd: { country: 'Iran', lat: 31.8974, lng: 54.3569 },
    tehran: { country: 'Iran', lat: 35.6892, lng: 51.389 },
    tabriz: { country: 'Iran', lat: 38.0962, lng: 46.2738 },
    kerman: { country: 'Iran', lat: 30.2839, lng: 57.0834 },
    mombasa: { country: 'Kenya', lat: -4.0435, lng: 39.6682 },
    nairobi: { country: 'Kenya', lat: -1.2921, lng: 36.8219 },
    madrid: { country: 'Spain', lat: 40.4168, lng: -3.7038 },
    barcelona: { country: 'Spain', lat: 41.3874, lng: 2.1686 },
    seville: { country: 'Spain', lat: 37.3891, lng: -5.9845 },
    rome: { country: 'Italy', lat: 41.9028, lng: 12.4964 },
    florence: { country: 'Italy', lat: 43.7696, lng: 11.2558 },
    venice: { country: 'Italy', lat: 45.4408, lng: 12.3155 },
    paris: { country: 'France', lat: 48.8566, lng: 2.3522 },
    london: { country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    lisbon: { country: 'Portugal', lat: 38.7223, lng: -9.1393 },
    vienna: { country: 'Austria', lat: 48.2082, lng: 16.3738 },
    prague: { country: 'Czechia', lat: 50.0755, lng: 14.4378 },
    amsterdam: { country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    berlin: { country: 'Germany', lat: 52.52, lng: 13.405 },
    athens: { country: 'Greece', lat: 37.9838, lng: 23.7275 },
    cairo: { country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    dubai: { country: 'UAE', lat: 25.2048, lng: 55.2708 },
    tokyo: { country: 'Japan', lat: 35.6762, lng: 139.6503 },
    kyoto: { country: 'Japan', lat: 35.0116, lng: 135.7681 },
    seoul: { country: 'South Korea', lat: 37.5665, lng: 126.978 },
    bangkok: { country: 'Thailand', lat: 13.7563, lng: 100.5018 },
    newyork: { country: 'United States', lat: 40.7128, lng: -74.006 },
  };

  const key = cleanCity.toLowerCase().replace(/\s+/g, '');
  const matchedKey = Object.keys(KNOWN_COORDS).find((k) => key.includes(k));
  const coord = matchedKey
    ? KNOWN_COORDS[matchedKey]
    : { country: 'International', lat: 40.4168, lng: -3.7038 };

  return {
    city: cleanCity,
    country: coord.country,
    lat: coord.lat,
    lng: coord.lng,
    pois: [],
  };
}

interface CityStayCatalogEntry {
  name: string;
  neighborhood: string;
  style: string;
  baseNightlyRate: number;
  bookingNote: string;
  dLat: number;
  dLng: number;
  transportMode: string;
  baseDailyTransit: number;
  transportNotes: string;
}

const CITY_ACCOMMODATION_CATALOG: Record<
  string,
  Record<TravelPersonality, CityStayCatalogEntry>
> = {
  madrid: {
    Luxury: {
      name: 'Four Seasons Hotel Madrid & Mandarin Oriental Ritz',
      neighborhood: 'Sevilla / Paseo del Prado',
      style: '5-Star Palace Hotel & Rooftop Spa',
      baseNightlyRate: 460,
      bookingNote: 'Includes Dani Brasserie rooftop terrace access & private concierge.',
      dLat: 0.0012,
      dLng: 0.0031,
      transportMode: 'Private VIP Mercedes Chauffeur & Black Car Transfers',
      baseDailyTransit: 110,
      transportNotes: 'Door-to-door private sedan transfers between galleries and Michelin dining.',
    },
    Foodie: {
      name: 'CoolRooms Palacio de Atocha (Culinary Quarter Boutique)',
      neighborhood: 'Barrio de las Letras / Antón Martín',
      style: 'Boutique Gastronomic Palace Stay',
      baseNightlyRate: 175,
      bookingNote: 'Steps from Mercado de Antón Martín, Cava Baja taverns, and San Miguel.',
      dLat: -0.0025,
      dLng: 0.0018,
      transportMode: 'Tarjeta Multi Metro Pass & Evening Tapas Taxis',
      baseDailyTransit: 24,
      transportNotes: 'Metro hops between markets plus evening cab rides after late dinners.',
    },
    Backpacker: {
      name: 'The Hat Madrid Rooftop Design Hostel',
      neighborhood: 'La Latina / Plaza Mayor',
      style: 'Award-Winning Social Design Hostel',
      baseNightlyRate: 38,
      bookingNote: 'Solar-powered boutique hostel with sunset sangria rooftop bar.',
      dLat: -0.0032,
      dLng: -0.0041,
      transportMode: 'Tarjeta Multi 10-Trip Metro Card & Walking',
      baseDailyTransit: 7,
      transportNotes: 'Walkable historic core paired with Zone A Metro passes.',
    },
    'Slow Traveler': {
      name: 'Hotel Orfila Relais & Châteaux Garden Mansion',
      neighborhood: 'Chamberí / Almagro',
      style: 'Quiet 19th-Century Courtyard Mansion',
      baseNightlyRate: 215,
      bookingNote: 'Tranquil tea garden and unhurried breakfast service away from crowds.',
      dLat: 0.0095,
      dLng: 0.0072,
      transportMode: 'Leisurely Boulevard Strolls & Occasional Cab',
      baseDailyTransit: 16,
      transportNotes: 'Gentle neighborhood walks with point-to-point taxi rides when needed.',
    },
    Adventurer: {
      name: 'Dear Hotel Madrid Skyview Basecamp',
      neighborhood: 'Plaza de España / Casa de Campo Edge',
      style: 'Active Urban Basecamp Hotel',
      baseNightlyRate: 150,
      bookingNote: 'Direct access to Casa de Campo trails and Madrid Río cycling greenway.',
      dLat: 0.0061,
      dLng: -0.0085,
      transportMode: 'BiciMAD Electric Bike Share + Regional Metro Pass',
      baseDailyTransit: 19,
      transportNotes: 'Unlimited e-bike docking across parks plus rapid metro links.',
    },
  },
  istanbul: {
    Luxury: {
      name: 'Çırağan Palace Kempinski Istanbul',
      neighborhood: 'Beşiktaş Waterfront on the Bosphorus',
      style: '5-Star Imperial Ottoman Palace Hotel',
      baseNightlyRate: 480,
      bookingNote: 'Private Bosphorus marble quay, infinity pool, and sultan hammock suites.',
      dLat: 0.0345,
      dLng: 0.0372,
      transportMode: 'Private Bosphorus Motor Launch & VIP Chauffeur',
      baseDailyTransit: 115,
      transportNotes: 'Private yacht transfers across the strait and chauffeured Mercedes vans.',
    },
    Foodie: {
      name: 'The Bank Hotel Istanbul (Karaköy Culinary Hub)',
      neighborhood: 'Karaköy / Galata Port',
      style: 'Boutique Heritage Gastronomy Hotel',
      baseNightlyRate: 165,
      bookingNote: 'Walking distance to Karaköy Güllüoğlu, Spice Bazaar, and Kadıköy ferries.',
      dLat: 0.0155,
      dLng: -0.0042,
      transportMode: 'Istanbulkart Ferry Crossings + Evening Taxis',
      baseDailyTransit: 20,
      transportNotes: 'Scenic commuter ferries to Kadıköy markets plus evening cabs.',
    },
    Backpacker: {
      name: 'Cheers Lighthouse Hostel Sultanahmet',
      neighborhood: 'Sultanahmet Seafront',
      style: 'Social Guesthouse with Marmara Terrace',
      baseNightlyRate: 32,
      bookingNote: 'Includes traditional Turkish breakfast overlooking the Sea of Marmara.',
      dLat: -0.0045,
      dLng: 0.0015,
      transportMode: 'Istanbulkart Public Tram, Ferry & Funicular Pass',
      baseDailyTransit: 6,
      transportNotes: 'T1 tramway, historic Karaköy funicular, and public Bosphorus ferries.',
    },
    'Slow Traveler': {
      name: 'Ibrahim Pasha Boutique Townhouse',
      neighborhood: 'Hippodrome / Quiet Sultanahmet Square',
      style: 'Intimate Ottoman Library & Terrace Residence',
      baseNightlyRate: 185,
      bookingNote: 'Fireside reading lounge and unhurried rooftop views of Blue Mosque.',
      dLat: -0.0021,
      dLng: -0.0031,
      transportMode: 'Bosphorus Passenger Ferries & Garden Walks',
      baseDailyTransit: 12,
      transportNotes: 'Unhurried sea crossings and short tram connections.',
    },
    Adventurer: {
      name: 'Galata Basecamp & Rooftop Loft Hotel',
      neighborhood: 'Galata / Beyoğlu',
      style: 'Active Urban Explorer Hotel',
      baseNightlyRate: 145,
      bookingNote: 'Central base for Golden Horn kayaking, Princes’ Islands cycling, and tower climbs.',
      dLat: 0.0172,
      dLng: -0.0045,
      transportMode: 'Bosphorus Ferry + Islands Bike Rental & Metro Pass',
      baseDailyTransit: 18,
      transportNotes: 'Multi-modal sea ferry, funicular, and bike rental access.',
    },
  },
  paris: {
    Luxury: {
      name: 'Le Bristol Paris (Oetker Collection Palace)',
      neighborhood: 'Rue du Faubourg Saint-Honoré',
      style: '5-Star Parisian Palace & Michelin Courtyard',
      baseNightlyRate: 540,
      bookingNote: 'Features 3-Michelin-star Epicure dining room and rooftop swimming pool.',
      dLat: 0.0152,
      dLng: -0.0365,
      transportMode: 'Private Chauffeur & Seine River Limousine',
      baseDailyTransit: 125,
      transportNotes: 'Private chauffeured transfers to galleries and evening dining.',
    },
    Foodie: {
      name: 'Hôtel des Grands Boulevards (Experimental Group)',
      neighborhood: 'Sentier / Le Marais Border',
      style: 'Boutique Culinary & Cocktail Hotel',
      baseNightlyRate: 210,
      bookingNote: 'Steps from Rue Montorgueil bakeries and Marché des Enfants Rouges.',
      dLat: 0.0135,
      dLng: -0.0085,
      transportMode: 'Navigo Metro Pass & Late-Night Bistro Taxis',
      baseDailyTransit: 24,
      transportNotes: 'Direct metro access across Left and Right Bank food halls.',
    },
    Backpacker: {
      name: 'The People Paris Marais Design Hostel',
      neighborhood: 'Bastille / Seine Quays',
      style: 'Contemporary Eco-Hostel & Rooftop',
      baseNightlyRate: 44,
      bookingNote: 'Panoramic Seine views and communal traveler kitchen.',
      dLat: -0.0082,
      dLng: 0.0115,
      transportMode: 'Navigo Easy Metro Card & Seine Footpaths',
      baseDailyTransit: 8,
      transportNotes: 'Unlimited central metro hops and riverside walks.',
    },
    'Slow Traveler': {
      name: 'Pavillon de la Reine & Spa',
      neighborhood: 'Place des Vosges (Le Marais)',
      style: 'Ivy-Clad 17th-Century Courtyard Sanctuary',
      baseNightlyRate: 255,
      bookingNote: 'Hidden behind the historic arcades of Place des Vosges.',
      dLat: -0.001,
      dLng: 0.0133,
      transportMode: 'Batobus Seine River Shuttle & Left Bank Strolls',
      baseDailyTransit: 15,
      transportNotes: 'Hop-on river boat stops and leisurely garden promenades.',
    },
    Adventurer: {
      name: 'citizenM Paris Gare de Lyon Skyview Basecamp',
      neighborhood: 'Quai de la Rapée / Canal Saint-Martin',
      style: 'Modern High-Rise Explorer Hotel',
      baseNightlyRate: 160,
      bookingNote: 'Direct access to Coulée Verte elevated trail and Vélib’ bike lanes.',
      dLat: -0.0115,
      dLng: 0.021,
      transportMode: 'Vélib’ Electric Bike Pass + RER & Metro',
      baseDailyTransit: 19,
      transportNotes: 'Protected Seine bike lanes and rapid metro connections.',
    },
  },
};

export type EconomyTier =
  | 'iran_local'
  | 'emerging_value'
  | 'western_or_major_hub';

export function convertFromEurBase(
  eurAmount: number,
  currencyCode = 'EUR'
): number {
  if (!Number.isFinite(eurAmount) || eurAmount <= 0) return 0;
  const code = String(currencyCode || 'EUR').toUpperCase().trim();
  if (code === 'EUR') return Math.max(1, Math.round(eurAmount));
  // 1 EUR = 1 / 0.92 USD (~1.087 USD), then multiply by target currency rate from USD
  const usdEquivalent = eurAmount / 0.92;
  const targetRate = getCurrencyRateFromUsd(code);
  return roundCurrencyAmount(usdEquivalent * targetRate, code);
}

export function getDestinationEconomyProfile(
  destination: string,
  country?: string
): { tier: EconomyTier; label: string } {
  const combined = `${destination} ${country || ''}`.toLowerCase();
  const iranKeywords = [
    'iran',
    'dehdasht',
    'yasuj',
    'kashan',
    'shiraz',
    'isfahan',
    'esfahan',
    'yazd',
    'tehran',
    'tabriz',
    'mashhad',
    'kerman',
    'ahvaz',
    'bushehr',
    'qeshm',
    'kish',
    'rasht',
    'hamadan',
    'kermanshah',
    'gachsaran',
    'sisakht',
    'kohgiluyeh',
    'boyer-ahmad',
    'lor',
    'zagros',
  ];
  if (iranKeywords.some((k) => combined.includes(k))) {
    return {
      tier: 'iran_local',
      label: 'Iranian Regional & Heritage Local Economy',
    };
  }

  const emergingKeywords = [
    'mombasa',
    'kenya',
    'nairobi',
    'cairo',
    'luxor',
    'egypt',
    'bangkok',
    'chiang mai',
    'thailand',
    'hanoi',
    'ho chi minh',
    'vietnam',
    'marrakech',
    'fes',
    'morocco',
    'tbilisi',
    'batumi',
    'georgia',
    'bali',
    'indonesia',
    'cusco',
    'lima',
    'peru',
  ];
  if (emergingKeywords.some((k) => combined.includes(k))) {
    return {
      tier: 'emerging_value',
      label: 'High-Value Emerging Regional Economy',
    };
  }

  return {
    tier: 'western_or_major_hub',
    label: 'International / European Market Economy',
  };
}

export function buildRecommendedAccommodationAndTransit(params: {
  destination: string;
  country?: string;
  currency?: string;
  centerLat: number;
  centerLng: number;
  personality: TravelPersonality;
  daysCount: number;
  totalBudget: number;
}): {
  accommodation: RecommendedAccommodation;
  dailyTransport: DailyTransportPlan;
} {
  const cleanCity = params.destination.trim() || 'Madrid';
  const currency = params.currency || 'EUR';
  const economy = getDestinationEconomyProfile(cleanCity, params.country);
  const nights = Math.max(1, params.daysCount);
  const days = Math.max(1, params.daysCount);

  if (economy.tier === 'iran_local') {
    const iranStayByPersonality: Record<
      TravelPersonality,
      {
        name: string;
        neighborhood: string;
        style: string;
        eurNightly: number;
        bookingNote: string;
        transportMode: string;
        eurDailyTransit: number;
        transportNotes: string;
      }
    > = {
      Backpacker: {
        name: `${cleanCity} Traditional Boomgardi Eco-Lodge`,
        neighborhood: `${cleanCity} Historic Old Quarter`,
        style: 'Authentic Local Boomgardi Guesthouse',
        eurNightly: 15,
        bookingNote: `Courtyard floor seating, home-cooked local breakfast, and warm regional hospitality in ${cleanCity}.`,
        transportMode: `Shared Savari Taxis & Old Town Walking in ${cleanCity}`,
        eurDailyTransit: 3,
        transportNotes: 'Walkable historic quarter paired with affordable local savari and Snapp rides.',
      },
      'Slow Traveler': {
        name: `Saray-e ${cleanCity} Courtyard Heritage House`,
        neighborhood: `${cleanCity} Traditional Garden Alley`,
        style: 'Restored Courtyard Eco-Lodge & Tea Garden',
        eurNightly: 22,
        bookingNote: `Tranquil central courtyard with pomegranate trees and afternoon herbal tea service in ${cleanCity}.`,
        transportMode: `Unhurried Old Quarter Walks & Snapp Local Taxis`,
        eurDailyTransit: 5,
        transportNotes: 'Point-to-point local Snapp rides and gentle neighborhood strolls.',
      },
      Adventurer: {
        name: `${cleanCity} Zagros Foothill & Valley Eco-Lodge`,
        neighborhood: `${cleanCity} Canyon & Trailhead Edge`,
        style: 'Mountain & Heritage Basecamp Eco-Lodge',
        eurNightly: 20,
        bookingNote: `Ideal basecamp for gorge excursions, waterfall hikes, and historic caravanserai trails around ${cleanCity}.`,
        transportMode: `Local Charter Taxi (Darbast) for Gorge & Valley Excursions`,
        eurDailyTransit: 6,
        transportNotes: 'Includes local driver transfers to surrounding nature gorges and trailheads.',
      },
      Foodie: {
        name: `Khaneh-ye Sonnati ${cleanCity} Culinary & Courtyard Stay`,
        neighborhood: `${cleanCity} Historic Bazaar & Caravanserai Quarter`,
        style: 'Boutique Culinary Boomgardi & Heritage Stay',
        eurNightly: 26,
        bookingNote: `Famous for wood-fired local bread, wild mountain herb stews (Ash-e Kardeh), and traditional courtyard dining in ${cleanCity}.`,
        transportMode: `Local Taxis (Snapp / Darbast) & Bazaar Footpaths`,
        eurDailyTransit: 5,
        transportNotes: 'Short local taxi hops between traditional kitchens, bakeries, and historic bazaars.',
      },
      Luxury: {
        name: `Grand Saray & Boutique Heritage Mansion ${cleanCity}`,
        neighborhood: `${cleanCity} Historic Royal & Caravanserai District`,
        style: 'Premier Restored Heritage Mansion & Private Courtyard',
        eurNightly: 35,
        bookingNote: `The finest private courtyard suite in ${cleanCity} with dedicated local host and curated regional feasts.`,
        transportMode: `Full-Day Private Darbast Driver & Air-Conditioned Sedan`,
        eurDailyTransit: 8,
        transportNotes: 'Dedicated private local driver on standby for all heritage and nature excursions.',
      },
    };

    const entry = iranStayByPersonality[params.personality];
    const nightlyRate = Math.max(1, convertFromEurBase(entry.eurNightly, currency));
    const totalStayCost = nightlyRate * nights;
    const dailyCostPerDay = Math.max(
      1,
      convertFromEurBase(entry.eurDailyTransit, currency)
    );
    const totalTransportCost = dailyCostPerDay * days;

    return {
      accommodation: {
        name: entry.name,
        neighborhood: entry.neighborhood,
        style: entry.style,
        nightlyRate,
        nights,
        totalStayCost,
        bookingNote: entry.bookingNote,
        lat: Number((params.centerLat + 0.0018).toFixed(5)),
        lng: Number((params.centerLng + 0.0018).toFixed(5)),
      },
      dailyTransport: {
        modeSummary: entry.transportMode,
        dailyCostPerDay,
        totalTransportCost,
        notes: entry.transportNotes,
      },
    };
  }

  if (economy.tier === 'emerging_value') {
    const emergingEurNightly: Record<TravelPersonality, number> = {
      Backpacker: 18,
      Adventurer: 42,
      'Slow Traveler': 48,
      Foodie: 55,
      Luxury: 135,
    };
    const emergingEurTransit: Record<TravelPersonality, number> = {
      Backpacker: 4,
      'Slow Traveler': 7,
      Foodie: 8,
      Adventurer: 10,
      Luxury: 28,
    };
    const nightlyRate = Math.max(
      1,
      convertFromEurBase(emergingEurNightly[params.personality], currency)
    );
    const dailyCostPerDay = Math.max(
      1,
      convertFromEurBase(emergingEurTransit[params.personality], currency)
    );
    return {
      accommodation: {
        name:
          params.personality === 'Luxury'
            ? `${cleanCity} Heritage Oceanfront & Boutique Palace Resort`
            : params.personality === 'Backpacker'
            ? `${cleanCity} Old Quarter Social Guesthouse & Courtyard`
            : `${cleanCity} Boutique Heritage & Courtyard Hotel`,
        neighborhood: `${cleanCity} Historic & Cultural Quarter`,
        style: `${params.personality} Verified Local Stay`,
        nightlyRate,
        nights,
        totalStayCost: nightlyRate * nights,
        bookingNote: `Authentic local rates anchored to ${cleanCity}’s real economy.`,
        lat: Number((params.centerLat + 0.002).toFixed(5)),
        lng: Number((params.centerLng + 0.002).toFixed(5)),
      },
      dailyTransport: {
        modeSummary:
          params.personality === 'Luxury'
            ? `Private Chauffeur & Local Excursion Vehicle in ${cleanCity}`
            : `Local Taxis, Tuk-Tuks / Transit & Old Town Walking in ${cleanCity}`,
        dailyCostPerDay,
        totalTransportCost: dailyCostPerDay * days,
        notes: `Anchored to real local transit fares in ${cleanCity}.`,
      },
    };
  }

  const cityKey = Object.keys(CITY_ACCOMMODATION_CATALOG).find((k) =>
    cleanCity.toLowerCase().includes(k)
  );

  const fallbackEntry: Record<TravelPersonality, CityStayCatalogEntry> = {
    Luxury: {
      name: `The Grand Palace & Ritz-Carlton ${cleanCity}`,
      neighborhood: `${cleanCity} Historic Royal Quarter`,
      style: '5-Star Flagship Palace Hotel & Spa',
      baseNightlyRate: 440,
      bookingNote: `VIP concierge, fine-dining terrace, and private transfers in ${cleanCity}.`,
      dLat: 0.0025,
      dLng: 0.0025,
      transportMode: `Private VIP Chauffeur & Black Car Service in ${cleanCity}`,
      baseDailyTransit: 105,
      transportNotes: 'Door-to-door private sedan service for all landmark and dining stops.',
    },
    Foodie: {
      name: `Hotel Gastronómico & Market House ${cleanCity}`,
      neighborhood: `${cleanCity} Old Market & Culinary Quarter`,
      style: 'Boutique Culinary Hotel',
      baseNightlyRate: 170,
      bookingNote: `Located steps from ${cleanCity}’s historic central food hall and artisanal bakeries.`,
      dLat: -0.002,
      dLng: 0.002,
      transportMode: `${cleanCity} Metro Pass & Evening Restaurant Taxis`,
      baseDailyTransit: 22,
      transportNotes: 'Daytime metro transit plus convenient evening taxis from tasting dinners.',
    },
    Backpacker: {
      name: `${cleanCity} Social Hub & Rooftop Hostel`,
      neighborhood: `${cleanCity} Old Town Pedestrian Lanes`,
      style: 'Charming Budget Guesthouse & Hostel',
      baseNightlyRate: 36,
      bookingNote: `Walkable to free viewpoints, street-food alleys, and central transit.`,
      dLat: -0.003,
      dLng: -0.002,
      transportMode: `${cleanCity} Multi-Day Public Metro/Bus Card & Walking`,
      baseDailyTransit: 7,
      transportNotes: 'High-value public transit pass and scenic walking routes.',
    },
    'Slow Traveler': {
      name: `Villa Jardín & Courtyard Residence ${cleanCity}`,
      neighborhood: `${cleanCity} Botanical & Literary District`,
      style: 'Serene Boutique Courtyard Guesthouse',
      baseNightlyRate: 195,
      bookingNote: `Quiet leafy courtyard ideal for slow mornings and afternoon reading.`,
      dLat: 0.004,
      dLng: -0.003,
      transportMode: `Unhurried Neighborhood Walks & Point-to-Point Taxis`,
      baseDailyTransit: 15,
      transportNotes: 'Gentle neighborhood walks supplemented by short cab rides.',
    },
    Adventurer: {
      name: `Nomad Explorer Basecamp Hotel ${cleanCity}`,
      neighborhood: `${cleanCity} Waterfront & Trailhead District`,
      style: 'Active Urban Explorer Hotel',
      baseNightlyRate: 145,
      bookingNote: `On-site bike storage and quick access to panoramic trails.`,
      dLat: 0.005,
      dLng: 0.004,
      transportMode: `City E-Bike Share + Unlimited Transit Pass`,
      baseDailyTransit: 18,
      transportNotes: 'Electric bike rentals paired with metro and ferry connections.',
    },
  };

  const entry = cityKey
    ? CITY_ACCOMMODATION_CATALOG[cityKey][params.personality]
    : fallbackEntry[params.personality];

  // Anchor to real local market rates for the personality without artificially burning oversized budgets
  const baseNightlyInCurrency = convertFromEurBase(
    entry.baseNightlyRate,
    currency
  );
  const baseTransitInCurrency = convertFromEurBase(
    entry.baseDailyTransit,
    currency
  );

  const nightlyRate =
    params.personality === 'Luxury'
      ? Math.min(
          Math.round(baseNightlyInCurrency * 1.25),
          Math.max(
            baseNightlyInCurrency,
            Math.round((params.totalBudget * 0.44) / nights)
          )
        )
      : params.personality === 'Backpacker'
      ? Math.min(
          baseNightlyInCurrency,
          Math.max(
            convertFromEurBase(22, currency),
            Math.round((params.totalBudget * 0.3) / nights)
          )
        )
      : baseNightlyInCurrency;

  const totalStayCost = nightlyRate * nights;
  const dailyCostPerDay = baseTransitInCurrency;
  const totalTransportCost = dailyCostPerDay * days;

  return {
    accommodation: {
      name: entry.name,
      neighborhood: entry.neighborhood,
      style: entry.style,
      nightlyRate,
      nights,
      totalStayCost,
      bookingNote: entry.bookingNote,
      lat: Number((params.centerLat + entry.dLat).toFixed(5)),
      lng: Number((params.centerLng + entry.dLng).toFixed(5)),
    },
    dailyTransport: {
      modeSummary: entry.transportMode,
      dailyCostPerDay,
      totalTransportCost,
      notes: entry.transportNotes,
    },
  };
}

/**
 * Deeply adapts a trip's day-by-day stops, categories, pacing, descriptions, and costs
 * to match the chosen TravelPersonality and destination's real-world local purchasing power.
 */
export function applyPersonalityProfileToDays(
  rawDays: TripDay[],
  params: {
    destination: string;
    country?: string;
    currency?: string;
    personality: TravelPersonality;
    totalBudget: number;
    accommodationCost: number;
    transportCost: number;
  }
): TripDay[] {
  const {
    destination,
    country,
    currency = 'EUR',
    personality,
    totalBudget,
    accommodationCost,
    transportCost,
  } = params;
  const economy = getDestinationEconomyProfile(destination, country);
  const cloned: TripDay[] = JSON.parse(JSON.stringify(rawDays));

  // Hyper-local Iranian regional & heritage pricing (€2–€6 meals, €0–€4 heritage/nature)
  if (economy.tier === 'iran_local') {
    const iranExtraFoodStops = [
      {
        suffix: 'Traditional Sangak Bakery, Local Honey & Morning Chai-Khaneh',
        desc: `Start the morning in ${destination} with pebble-baked hot sangak bread, local mountain honey, sheep cheese, and cardamom tea.`,
        category: 'Food & Dining' as StopCategory,
        startTime: '08:30',
        endTime: '09:45',
        eurCost: 2,
      },
      {
        suffix: 'Traditional Courtyard Kitchen (Dizi, Ash-e Kardeh & Saffron Tahchin)',
        desc: `Conclude the day at a beloved local kitchen in ${destination} for slow-cooked stoneware Dizi, wild herb soup, and charcoal kebab.`,
        category: 'Food & Dining' as StopCategory,
        startTime: '19:00',
        endTime: '20:45',
        eurCost: 5,
      },
      {
        suffix: 'Bazaar Confectionery, Saffron Bastani & Herbal Tea House',
        desc: `Sample rosewater-and-pistachio ice cream, walnut pastries, and mountain thyme tea in ${destination}’s historic bazaar.`,
        category: 'Food & Dining' as StopCategory,
        startTime: '18:30',
        endTime: '20:00',
        eurCost: 3,
      },
    ];

    const iranDays = cloned.map((day, dIdx) => {
      let stops = [...day.stops];

      if (personality === 'Slow Traveler') {
        stops = stops.slice(0, Math.min(3, Math.max(2, stops.length)));
        const slowSlots = [
          ['10:00', '12:00'],
          ['13:00', '15:00'],
          ['16:00', '18:00'],
        ];
        stops = stops.map((s, sIdx) => ({
          ...s,
          startTime: slowSlots[sIdx]?.[0] || s.startTime,
          endTime: slowSlots[sIdx]?.[1] || s.endTime,
          durationMinutes: 120,
          description: `${s.description} Paced for unhurried Slow Traveler immersion with a long courtyard tea pause.`,
        }));
      } else if (
        (personality === 'Foodie' || personality === 'Luxury') &&
        stops.length < 4
      ) {
        const extra = iranExtraFoodStops[dIdx % iranExtraFoodStops.length];
        const firstStop = stops[0] || {
          lat: 30.7936,
          lng: 50.5647,
        };
        const distinctOffsets: Array<[number, number]> = [
          [0.0068, 0.0054],
          [-0.0072, 0.0061],
          [0.0059, -0.0065],
        ];
        const [offLat, offLng] =
          distinctOffsets[dIdx % distinctOffsets.length];
        stops.push({
          id: `stop-iran-extra-${dIdx + 1}-${Date.now()}`,
          name: `${destination} Day ${dIdx + 1}: ${extra.suffix}`,
          description: extra.desc,
          category: extra.category,
          startTime: extra.startTime,
          endTime: extra.endTime,
          durationMinutes: 105,
          travelFromPrevMinutes: 12,
          distanceFromPrevKm: 0.8,
          openingHours:
            dIdx % 2 === 0 ? '08:00-22:30' : '11:00-23:00',
          estimatedCost: convertFromEurBase(extra.eurCost, currency),
          lat: Number((firstStop.lat + offLat).toFixed(5)),
          lng: Number((firstStop.lng + offLng).toFixed(5)),
          isIndoor: true,
          mysteryClue: `An authentic local culinary gathering spot in ${destination}.`,
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        });
      }

      // Anchor every stop's cost strictly to real Iranian local economy (€2–€6 for meals, €0–€4 for sites)
      stops = stops.map((s) => {
        const isFood =
          s.category === 'Food & Dining' || s.category === 'Shopping & Markets';
        const isFreeNature =
          s.category === 'Nature & Parks' && (s.estimatedCost === 0 || s.name.toLowerCase().includes('gorge') || s.name.toLowerCase().includes('overlook'));
        let eurCost = isFreeNature
          ? 0
          : isFood
          ? personality === 'Luxury'
            ? 6
            : personality === 'Foodie'
            ? 5
            : personality === 'Backpacker'
            ? 3
            : 4
          : personality === 'Luxury'
          ? 4
          : 2;

        return {
          ...s,
          estimatedCost:
            eurCost === 0 ? 0 : Math.max(1, convertFromEurBase(eurCost, currency)),
        };
      });

      return {
        ...day,
        stops,
      };
    });

    const stopsSum = iranDays
      .flatMap((d) => d.stops)
      .reduce((acc, s) => acc + Number(s.estimatedCost || 0), 0);
    const realisticTotal = accommodationCost + transportCost + stopsSum;

    if (totalBudget > realisticTotal * 1.4 && iranDays.length > 0) {
      const surplus = Math.max(0, totalBudget - realisticTotal);
      const surplusNote = `High-Value Destination Note: ${destination} offers exceptional local purchasing power (~${formatCurrency(
        realisticTotal,
        currency
      )} total for eco-lodge stay, local transit, and authentic meals), leaving a substantial ${formatCurrency(
        surplus,
        currency
      )} budget surplus from your ${formatCurrency(totalBudget, currency)} allocation.`;
      iranDays[0].dailyBriefing.vibeSummary = `${iranDays[0].dailyBriefing.vibeSummary} ${surplusNote}`;
    }

    return iranDays;
  }

  // Add a 4th culinary dinner or active stop if needed for Foodie, Luxury, or Adventurer in international cities
  const extraFoodieStops = [
    {
      suffix: 'Artisanal Morning Bakery & Specialty Coffee Roastery',
      desc: `Start the morning at ${destination}’s acclaimed artisan bakery for warm pastries, single-origin espresso, and regional breakfast delicacies.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '09:00',
      endTime: '10:15',
      baseCost: 22,
    },
    {
      suffix: 'Heritage Wine Cellar & Regional Tasting Dinner',
      desc: `Conclude the evening with a curated multi-course regional tasting dinner and sommelier pairings in ${destination}’s culinary quarter.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:30',
      endTime: '21:30',
      baseCost: 68,
    },
    {
      suffix: 'Covered Gastronomic Market & Confectionery Tasting',
      desc: `Sample artisanal cheeses, cured delicacies, and traditional confections from family-run purveyors.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:15',
      endTime: '21:00',
      baseCost: 54,
    },
    {
      suffix: 'Chef’s Table Bistro & Seasonal Wood-Fired Kitchen',
      desc: `Dine on heirloom regional recipes cooked over open oak embers with local vintages.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:30',
      endTime: '21:30',
      baseCost: 72,
    },
    {
      suffix: 'Old Quarter Chocolatería & Evening Tapas Crawl',
      desc: `Experience ${destination}’s liveliest evening culinary lane with signature small plates and sweet specialties.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:15',
      endTime: '21:15',
      baseCost: 58,
    },
  ];

  const extraLuxuryStops = [
    {
      suffix: 'Michelin-Starred Tasting Dinner & Sommelier Pairing',
      desc: `Reserved chef’s tasting menu with grand cru wine pairings in an acclaimed ${destination} fine-dining salon.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '20:00',
      endTime: '22:30',
      baseCost: 210,
    },
    {
      suffix: 'Private Rooftop Champagne Terrace & Acoustic Salon',
      desc: `VIP terrace table overlooking ${destination}’s illuminated skyline with vintage champagne and artisanal canapés.`,
      category: 'Nightlife & Entertainment' as StopCategory,
      startTime: '19:30',
      endTime: '21:45',
      baseCost: 165,
    },
    {
      suffix: 'Bespoke Thermal Hammam / Royal Spa Sanctuary & Gastronomy',
      desc: `Private suite spa ritual followed by a multi-course gastronomic dinner in ${destination}.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:30',
      endTime: '22:00',
      baseCost: 195,
    },
    {
      suffix: 'Private Collector’s Atelier & Haute Cuisine Dinner',
      desc: `After-hours gallery reception followed by a white-tablecloth tasting menu by one of ${destination}’s master chefs.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '19:45',
      endTime: '22:15',
      baseCost: 225,
    },
    {
      suffix: 'Farewell Palace Terrace Gala Dinner',
      desc: `Celebrate the final evening with a private terrace dinner overlooking ${destination}’s landmarks.`,
      category: 'Food & Dining' as StopCategory,
      startTime: '20:00',
      endTime: '22:30',
      baseCost: 240,
    },
  ];

  const transformedDays = cloned.map((day, dIdx) => {
    let stops = [...day.stops];

    if (personality === 'Slow Traveler') {
      // Strictly max 2-3 stops per day, gentle starts, 2-hour lingering windows
      stops = stops.slice(0, Math.min(3, Math.max(2, stops.length)));
      const slowSlots = [
        ['10:00', '12:00'],
        ['13:00', '15:00'],
        ['16:00', '18:00'],
      ];
      stops = stops.map((s, sIdx) => ({
        ...s,
        startTime: slowSlots[sIdx]?.[0] || s.startTime,
        endTime: slowSlots[sIdx]?.[1] || s.endTime,
        durationMinutes: 120,
        description: `${s.description} Paced for unhurried Slow Traveler immersion with time for a quiet café pause.`,
        estimatedCost: Math.max(12, Math.round((s.estimatedCost || 18) * 1.15)),
      }));
      day.dailyBriefing = {
        vibeSummary: `Unhurried Slow Traveler rhythm (max ${stops.length} stops) with 2-hour lingering windows, peaceful gardens, and long café breaks.`,
        etiquetteTip: day.dailyBriefing.etiquetteTip,
        wearAdvice: 'Relaxed, comfortable layers ideal for leisurely neighborhood walks and terrace reading.',
      };
    } else if (personality === 'Foodie') {
      // Ensure 3-4 stops per day with heavy culinary emphasis
      if (stops.length < 4) {
        const extra = extraFoodieStops[dIdx % extraFoodieStops.length];
        const anchor = stops[stops.length - 1] || {
          lat: 40.4168,
          lng: -3.7038,
        };
        stops.push({
          id: `stop-foodie-extra-${dIdx + 1}-${Date.now()}`,
          name: `${destination} Day ${dIdx + 1} ${extra.suffix}`,
          description: extra.desc,
          category: extra.category,
          startTime: extra.startTime,
          endTime: extra.endTime,
          durationMinutes: 120,
          travelFromPrevMinutes: 15,
          distanceFromPrevKm: 0.9,
          openingHours: '12:00-23:30',
          estimatedCost: extra.baseCost,
          lat: Number((anchor.lat + 0.0035).toFixed(5)),
          lng: Number((anchor.lng - 0.0035).toFixed(5)),
          isIndoor: true,
          mysteryClue: `An acclaimed culinary table in ${destination} reserved for evening gastronomy.`,
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        });
      }
      stops = stops.map((s, sIdx) => {
        const isFood = s.category === 'Food & Dining' || s.category === 'Shopping & Markets';
        if (isFood) {
          return {
            ...s,
            category: 'Food & Dining',
            description: `${s.description} Includes curated tastings of signature regional specialties and artisan pairings.`,
            estimatedCost: Math.max(28, Math.round((s.estimatedCost || 24) * 1.55)),
          };
        }
        if (sIdx === 0) {
          return {
            ...s,
            description: `${s.description} Preceded by morning artisanal pastries and specialty roast coffee at a historic neighborhood bakery nearby.`,
            estimatedCost: Math.max(22, Math.round((s.estimatedCost || 18) + 12)),
          };
        }
        return s;
      });
      day.dailyBriefing = {
        vibeSummary: `Gastronomic Foodie immersion featuring historic morning bakeries, bustling midday market halls, and regional evening dining.`,
        etiquetteTip: day.dailyBriefing.etiquetteTip,
        wearAdvice: 'Comfortable footwear for market halls and smart-casual evening wear for bistro reservations.',
      };
    } else if (personality === 'Luxury') {
      if (stops.length < 4) {
        const extra = extraLuxuryStops[dIdx % extraLuxuryStops.length];
        const anchor = stops[stops.length - 1] || {
          lat: 40.4168,
          lng: -3.7038,
        };
        stops.push({
          id: `stop-luxury-extra-${dIdx + 1}-${Date.now()}`,
          name: `${destination} Day ${dIdx + 1}: ${extra.suffix}`,
          description: extra.desc,
          category: extra.category,
          startTime: extra.startTime,
          endTime: extra.endTime,
          durationMinutes: 135,
          travelFromPrevMinutes: 12,
          distanceFromPrevKm: 1.1,
          openingHours: '12:00-23:59',
          estimatedCost: extra.baseCost,
          lat: Number((anchor.lat + 0.004).toFixed(5)),
          lng: Number((anchor.lng + 0.004).toFixed(5)),
          isIndoor: true,
          mysteryClue: `White-glove gastronomy and vintage pairings at ${destination}’s premier table.`,
          isCompleted: false,
          upvotes: ['user-traveler-1'],
          downvotes: [],
          comments: [],
        });
      }
      stops = stops.map((s) => {
        const isDining = s.category === 'Food & Dining';
        const isCulture =
          s.category === 'History & Culture' || s.category === 'Art & Museums';
        return {
          ...s,
          name:
            isCulture && !s.name.includes('Private')
              ? `${s.name} (Private Curator-Led VIP Tour)`
              : isDining && !s.name.includes('Fine') && !s.name.includes('Michelin') && !s.name.includes('Tasting')
              ? `${s.name} — Chef’s Tasting & Reserve Cellar`
              : s.name,
          description: isCulture
            ? `${s.description} Includes private skip-the-line art historian guide and VIP salon access.`
            : isDining
            ? `${s.description} Elevated with a reserved tasting menu and sommelier cellar pairings.`
            : `${s.description} Arranged with private chauffeur drop-off and VIP hospitality.`,
          estimatedCost: isDining
            ? Math.max(135, Math.round((s.estimatedCost || 35) * 4.5))
            : isCulture
            ? Math.max(95, Math.round((s.estimatedCost || 20) * 4.2))
            : Math.max(65, Math.round((s.estimatedCost || 15) * 3.5)),
        };
      });
      day.dailyBriefing = {
        vibeSummary: `Five-star Luxury curation with private art-historian access, chauffeured transfers, and acclaimed fine-dining reservations.`,
        etiquetteTip: day.dailyBriefing.etiquetteTip,
        wearAdvice: 'Tailored smart-elegant attire suitable for 5-star palace lounges and fine-dining salons.',
      };
    } else if (personality === 'Backpacker') {
      stops = stops.map((s) => {
        const isDining = s.category === 'Food & Dining';
        return {
          ...s,
          description: isDining
            ? `${s.description} Focused on high-value authentic street-food stalls and beloved local counter eats.`
            : `${s.description} Accessed via public metro/walking route with free or youth/off-peak admission tips.`,
          estimatedCost: isDining
            ? Math.min(14, Math.max(6, Math.round((s.estimatedCost || 16) * 0.45)))
            : Math.min(10, Math.max(0, Math.round((s.estimatedCost || 14) * 0.35))),
        };
      });
      day.dailyBriefing = {
        vibeSummary: `High-value Backpacker route combining free architectural landmarks, street-food stalls, scenic parks, and public metro transit.`,
        etiquetteTip: day.dailyBriefing.etiquetteTip,
        wearAdvice: 'Lightweight daypack, refillable water bottle, and broken-in walking shoes.',
      };
    } else if (personality === 'Adventurer') {
      stops = stops.map((s, sIdx) => ({
        ...s,
        description:
          sIdx === 0
            ? `${s.description} Active morning exploration before the crowds arrive.`
            : `${s.description} Connected via scenic urban trail and active viewpoint climb.`,
        estimatedCost: Math.max(18, Math.round((s.estimatedCost || 20) * 1.2)),
      }));
      day.dailyBriefing = {
        vibeSummary: `Energetic Adventurer pace featuring panoramic tower climbs, active urban trails, and outdoor waterfront exploration.`,
        etiquetteTip: day.dailyBriefing.etiquetteTip,
        wearAdvice: 'Breathable athletic layers, supportive trail/walking shoes, and weather shell.',
      };
    }

    return {
      ...day,
      stops,
    };
  });

  // For emerging_value or Backpacker, keep authentic local prices without inflating to burn budget
  if (economy.tier === 'emerging_value' || personality === 'Backpacker') {
    for (const day of transformedDays) {
      for (const stop of day.stops) {
        if (stop.estimatedCost > 0) {
          const baseEur =
            economy.tier === 'emerging_value'
              ? Math.max(4, Math.round(stop.estimatedCost * 0.55))
              : stop.estimatedCost;
          stop.estimatedCost = Math.max(1, convertFromEurBase(baseEur, currency));
        }
      }
    }
    const stopsTotal = transformedDays
      .flatMap((d) => d.stops)
      .reduce((acc, s) => acc + Number(s.estimatedCost || 0), 0);
    const fullTotal = accommodationCost + transportCost + stopsTotal;
    if (totalBudget > fullTotal * 1.5 && transformedDays.length > 0) {
      const surplus = Math.max(0, totalBudget - fullTotal);
      transformedDays[0].dailyBriefing.vibeSummary = `${transformedDays[0].dailyBriefing.vibeSummary} High-Value Budget Note: Realistic local costs total ~${formatCurrency(
        fullTotal,
        currency
      )}, leaving a ${formatCurrency(
        surplus,
        currency
      )} surplus from your ${formatCurrency(totalBudget, currency)} budget.`;
    }
    return transformedDays;
  }

  // Convert stop costs to target currency and cap scaling so prices never artificially explode
  for (const day of transformedDays) {
    for (const stop of day.stops) {
      if (stop.estimatedCost > 0) {
        stop.estimatedCost = Math.max(
          1,
          convertFromEurBase(stop.estimatedCost, currency)
        );
      }
    }
  }

  const rawStopsSum = transformedDays
    .flatMap((d) => d.stops)
    .reduce((acc, s) => acc + Number(s.estimatedCost || 0), 0);
  const fullRealistic = accommodationCost + transportCost + rawStopsSum;

  if (totalBudget > fullRealistic * 1.6 && transformedDays.length > 0) {
    const surplus = Math.max(0, totalBudget - fullRealistic);
    transformedDays[0].dailyBriefing.vibeSummary = `${transformedDays[0].dailyBriefing.vibeSummary} Budget Surplus Note: Estimated expenses in ${destination} total ${formatCurrency(
      fullRealistic,
      currency
    )}, leaving a ${formatCurrency(
      surplus,
      currency
    )} surplus from your ${formatCurrency(totalBudget, currency)} budget.`;
  }

  return transformedDays;
}

export function buildFallbackCityTemplate(params: {
  destination: string;
  startDate: string;
  daysCount: number;
  personality: TravelPersonality;
  totalBudget?: number;
  currency?: string;
  verifiedPlaces: VerifiedPlace[];
  dynamicCityInfo?: {
    city: string;
    country: string;
    lat: number;
    lng: number;
    pois: Array<{ name: string; lat: number; lng: number; category: StopCategory }>;
  };
}): {
  destination: string;
  country: string;
  centerLat: number;
  centerLng: number;
  title: string;
  accommodation: RecommendedAccommodation;
  dailyTransport: DailyTransportPlan;
  days: TripDay[];
} {
  const destLower = params.destination.toLowerCase().trim();
  const requestedDays = Math.max(1, Math.min(7, params.daysCount || 3));
  const currency = params.currency || 'EUR';
  const suggestedBudgetInfo = getSuggestedTripBudget({
    personality: params.personality,
    currency,
    daysCount: requestedDays,
    destination: params.destination,
  });
  const effectiveBudget =
    params.totalBudget && params.totalBudget >= 20
      ? params.totalBudget
      : suggestedBudgetInfo.totalBudget;

  if (destLower.includes('istanbul') || destLower.includes('turkey')) {
    const rawDays = buildIstanbulDays(params.startDate, params.personality).slice(
      0,
      requestedDays
    );
    const { accommodation, dailyTransport } =
      buildRecommendedAccommodationAndTransit({
        destination: 'Istanbul',
        country: 'Turkey',
        currency,
        centerLat: 41.0082,
        centerLng: 28.9784,
        personality: params.personality,
        daysCount: requestedDays,
        totalBudget: effectiveBudget,
      });
    const profiledDays = applyPersonalityProfileToDays(rawDays, {
      destination: 'Istanbul',
      country: 'Turkey',
      currency,
      personality: params.personality,
      totalBudget: effectiveBudget,
      accommodationCost: accommodation.totalStayCost,
      transportCost: dailyTransport.totalTransportCost,
    });
    return {
      destination: 'Istanbul',
      country: 'Turkey',
      centerLat: 41.0082,
      centerLng: 28.9784,
      title: `Istanbul ${params.personality} Expedition`,
      accommodation,
      dailyTransport,
      days: groundAndEnrichDays(
        profiledDays,
        params.verifiedPlaces,
        41.0082,
        28.9784
      ),
    };
  }

  // Check if destination matches any of our rich multi-day blueprints (Madrid, Shiraz, Dehdasht, Yasuj, Kashan, Mombasa, Rome, Paris, Barcelona)
  const blueprintKey = Object.keys(CITY_BLUEPRINTS).find((k) =>
    destLower.includes(k)
  );
  if (blueprintKey) {
    const bp = CITY_BLUEPRINTS[blueprintKey];
    const baseDate = new Date(params.startDate || '2026-11-12');
    const getDate = (o: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + o);
      return d.toISOString().split('T')[0];
    };

    const days: TripDay[] = Array.from({ length: requestedDays }, (_, i) => {
      const theme = bp.dayThemes[i % bp.dayThemes.length];
      const cycle = Math.floor(i / bp.dayThemes.length);
      const rawStops =
        params.personality === 'Slow Traveler'
          ? theme.stops.slice(0, 3)
          : theme.stops;

      const stops: TripStop[] = rawStops.map((s, sIdx) => ({
        id: `stop-${blueprintKey}-${i + 1}-${sIdx + 1}-${Date.now()}`,
        name:
          cycle === 0
            ? s.name
            : `${bp.destination} ${s.category.split(' ')[0]} Quarter: ${s.name}`,
        description: s.description,
        category: s.category,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: 105,
        travelFromPrevMinutes: 0,
        distanceFromPrevKm: 0,
        openingHours: s.openingHours,
        estimatedCost: s.estimatedCost,
        lat: Number((s.lat + cycle * 0.004).toFixed(5)),
        lng: Number((s.lng + cycle * 0.004).toFixed(5)),
        isIndoor: s.isIndoor,
        verifiedPlaceId: s.verifiedPlaceId,
        mysteryClue: s.mysteryClue,
        isCompleted: false,
        upvotes: ['user-traveler-1'],
        downvotes: [],
        comments: [],
      }));

      return {
        dayNumber: i + 1,
        date: getDate(i),
        title: theme.title,
        mysteryModeEnabled: false,
        revealedStopCount: 3,
        dailyBriefing: {
          vibeSummary: theme.vibe,
          etiquetteTip: theme.etiquette,
          wearAdvice: theme.wear,
        },
        stops,
      };
    });

    const { accommodation, dailyTransport } =
      buildRecommendedAccommodationAndTransit({
        destination: bp.destination,
        country: bp.country,
        currency,
        centerLat: bp.centerLat,
        centerLng: bp.centerLng,
        personality: params.personality,
        daysCount: requestedDays,
        totalBudget: effectiveBudget,
      });

    const profiledDays = applyPersonalityProfileToDays(days, {
      destination: bp.destination,
      country: bp.country,
      currency,
      personality: params.personality,
      totalBudget: effectiveBudget,
      accommodationCost: accommodation.totalStayCost,
      transportCost: dailyTransport.totalTransportCost,
    });

    return {
      destination: bp.destination,
      country: bp.country,
      centerLat: bp.centerLat,
      centerLng: bp.centerLng,
      title: `${bp.destination} ${params.personality} Journey`,
      accommodation,
      dailyTransport,
      days: groundAndEnrichDays(
        profiledDays,
        params.verifiedPlaces,
        bp.centerLat,
        bp.centerLng
      ),
    };
  }

  if (destLower.includes('tokyo') || destLower.includes('japan')) {
    const baseDate = new Date(params.startDate || '2026-11-12');
    const getDate = (o: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + o);
      return d.toISOString().split('T')[0];
    };
    const tokyoDaysPool: TripDay[] = [
      {
        dayNumber: 1,
        date: getDate(0),
        title: 'Asakusa Heritage, Tsukiji Market & teamLab Digital Art',
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
        title: 'Shinjuku Zen Gardens, Meiji Shrine & Craft Ramen',
        mysteryModeEnabled: false,
        revealedStopCount: 3,
        dailyBriefing: {
          vibeSummary:
            'Tranquil maple pavilions balanced with Tokyo’s forested Shinto shrines and ramen craft.',
          etiquetteTip:
            'Bow once before passing beneath the wooden torii gates at Meiji Jingu.',
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
            endTime: '11:45',
            durationMinutes: 135,
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
            startTime: '12:30',
            endTime: '14:15',
            durationMinutes: 105,
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
          {
            id: `stop-tyo-6`,
            name: 'Meiji Jingu Forest Sanctuary & Harajuku Walk',
            description:
              'Walk beneath towering cedar torii gates and stacked sake barrels in a 170-acre evergreen forest.',
            category: 'History & Culture',
            startTime: '15:00',
            endTime: '17:00',
            durationMinutes: 120,
            travelFromPrevMinutes: 15,
            distanceFromPrevKm: 2.1,
            openingHours: '06:30-18:30',
            estimatedCost: 0,
            lat: 35.6764,
            lng: 139.6993,
            isIndoor: false,
            mysteryClue: 'One hundred thousand donated trees form a quiet sanctuary in the heart of Shibuya.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
        ],
      },
      {
        dayNumber: 3,
        date: getDate(2),
        title: 'Yanaka Old Tokyo, Ueno Museums & Shibuya Sky',
        mysteryModeEnabled: false,
        revealedStopCount: 3,
        dailyBriefing: {
          vibeSummary: 'Preserved Edo shitamachi wooden lanes contrasted with futuristic Shibuya views.',
          etiquetteTip: 'Reserve Shibuya Sky sunset slots ahead of time.',
          wearAdvice: 'Light jacket for open-air rooftop observation deck.',
        },
        stops: [
          {
            id: `stop-tyo-7`,
            name: 'Tokyo National Museum (Ueno Park)',
            description: 'Discover samurai armor, ukiyo-e woodblock prints, and National Treasures in the Honkan gallery.',
            category: 'Art & Museums',
            startTime: '09:30',
            endTime: '12:00',
            durationMinutes: 150,
            travelFromPrevMinutes: 0,
            distanceFromPrevKm: 0,
            openingHours: '09:30-17:00',
            estimatedCost: 12,
            lat: 35.7188,
            lng: 139.7765,
            isIndoor: true,
            mysteryClue: 'Japan’s oldest national museum crowned by imperial Meiji crown-tile roofs.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
          {
            id: `stop-tyo-8`,
            name: 'Yanaka Ginza Shopping Street & Artisanal Taiyaki',
            description: 'Browse traditional woodblock stationery shops and taste crisp red-bean taiyaki pastries.',
            category: 'Shopping & Markets',
            startTime: '12:45',
            endTime: '14:30',
            durationMinutes: 105,
            travelFromPrevMinutes: 14,
            distanceFromPrevKm: 1.4,
            openingHours: '10:00-19:00',
            estimatedCost: 16,
            lat: 35.7278,
            lng: 139.7657,
            isIndoor: false,
            mysteryClue: 'Descend the Sunset Stairs into a preserved 1950s Tokyo neighborhood market lane.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
          {
            id: `stop-tyo-9`,
            name: 'Shibuya Crossing & Shibuya Sky 360 Deck',
            description: 'Experience the world’s busiest pedestrian scramble from 229 meters above Tokyo.',
            category: 'Nightlife & Entertainment',
            startTime: '16:00',
            endTime: '18:00',
            durationMinutes: 120,
            travelFromPrevMinutes: 28,
            distanceFromPrevKm: 9.2,
            openingHours: '10:00-22:30',
            estimatedCost: 20,
            lat: 35.658,
            lng: 139.7016,
            isIndoor: false,
            mysteryClue: 'Five pedestrian streams converge below an open-air helipad in the clouds.',
            upvotes: [],
            downvotes: [],
            comments: [],
          },
        ],
      },
    ];
    const { accommodation, dailyTransport } =
      buildRecommendedAccommodationAndTransit({
        destination: 'Tokyo',
        country: 'Japan',
        currency,
        centerLat: 35.6762,
        centerLng: 139.6503,
        daysCount: requestedDays,
        personality: params.personality,
        totalBudget: effectiveBudget,
      });
    const profiledDays = applyPersonalityProfileToDays(
      tokyoDaysPool.slice(0, requestedDays),
      {
        destination: 'Tokyo',
        country: 'Japan',
        currency,
        personality: params.personality,
        totalBudget: effectiveBudget,
        accommodationCost: accommodation.totalStayCost,
        transportCost: dailyTransport.totalTransportCost,
      }
    );
    return {
      destination: 'Tokyo',
      country: 'Japan',
      centerLat: 35.6762,
      centerLng: 139.6503,
      title: `Tokyo ${params.personality} Discovery`,
      accommodation,
      dailyTransport,
      days: groundAndEnrichDays(
        profiledDays,
        params.verifiedPlaces,
        35.6762,
        139.6503
      ),
    };
  }

  // Dynamic Custom Destination Fallback (uses resolved coordinates & never repeats stops across days)
  const cityLabel =
    params.dynamicCityInfo?.city ||
    params.destination.trim() ||
    'Madrid';
  const countryLabel = params.dynamicCityInfo?.country || 'International';
  const cLat = params.dynamicCityInfo?.lat ?? 40.4168;
  const cLng = params.dynamicCityInfo?.lng ?? -3.7038;
  const pois = params.dynamicCityInfo?.pois || [];

  const baseDate = new Date(params.startDate || '2026-11-12');
  const getDate = (o: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + o);
    return d.toISOString().split('T')[0];
  };

  const dayThemeConfigs = [
    {
      title: `${cityLabel} Historic Center, Central Market & Heritage Museum`,
      vibe: `An immersive first day exploring ${cityLabel}’s historic heart, central bazaar, and flagship museum.`,
      stops: [
        {
          name: pois[0]?.name || `${cityLabel} Old Town & Main Historic Square`,
          desc: `Begin at the architectural heart of ${cityLabel}, exploring landmark plazas and centuries-old heritage facades.`,
          cat: 'History & Culture' as StopCategory,
          dLat: 0.0025,
          dLng: -0.0035,
          hours: '08:00-19:30',
          cost: 12,
          indoor: false,
        },
        {
          name: `${cityLabel} Central Gastronomic Market & Bazaar`,
          desc: `Sample regional specialties, cured delicacies, and seasonal produce from local purveyors in ${cityLabel}.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: -0.0045,
          dLng: 0.0028,
          hours: '09:00-21:00',
          cost: 22,
          indoor: true,
        },
        {
          name: pois[1]?.name || `${cityLabel} National Art & Heritage Museum`,
          desc: `Discover curated collections showcasing ${cityLabel}’s artistic, archaeological, and cultural legacy.`,
          cat: 'Art & Museums' as StopCategory,
          dLat: 0.0068,
          dLng: 0.0052,
          hours: '09:30-18:30',
          cost: 16,
          indoor: true,
        },
        {
          name: `${cityLabel} Sunset Mirador & Old Quarter Tea House`,
          desc: `Unwind over aromatic regional tea and pastries while overlooking the historic rooftops of ${cityLabel}.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: -0.0072,
          dLng: -0.0055,
          hours: '11:00-22:30',
          cost: 14,
          indoor: false,
        },
      ],
    },
    {
      title: `${cityLabel} Royal Gardens, Artisanal Quarter & Evening Promenade`,
      vibe: `Botanical promenades, craft workshops, and panoramic twilight views over ${cityLabel}.`,
      stops: [
        {
          name: pois[2]?.name || `${cityLabel} Botanical & Palace Gardens`,
          desc: `Stroll shaded avenues, ornamental fountains, and glass conservatories in ${cityLabel}.`,
          cat: 'Nature & Parks' as StopCategory,
          dLat: 0.0095,
          dLng: -0.0075,
          hours: '07:00-20:00',
          cost: 6,
          indoor: false,
        },
        {
          name: `${cityLabel} Old Quarter Artisanal Kitchen`,
          desc: `Enjoy a relaxed multi-course regional lunch prepared with locally sourced ingredients.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: 0.0048,
          dLng: -0.0018,
          hours: '11:30-22:00',
          cost: 24,
          indoor: true,
        },
        {
          name: `${cityLabel} Craft Arcade & Caravanserai Workshops`,
          desc: `Browse independent studios, hand-woven textiles, and copper/ceramic ateliers in ${cityLabel}.`,
          cat: 'Shopping & Markets' as StopCategory,
          dLat: -0.0058,
          dLng: -0.0082,
          hours: '09:00-20:30',
          cost: 15,
          indoor: true,
        },
        {
          name: `${cityLabel} Panoramic Ridge & Foothill Trail`,
          desc: `Follow the scenic ridge path for golden-hour photography across ${cityLabel} and its surrounding valley.`,
          cat: 'Nature & Parks' as StopCategory,
          dLat: 0.0135,
          dLng: 0.0095,
          hours: '06:30-20:30',
          cost: 0,
          indoor: false,
        },
      ],
    },
    {
      title: `${cityLabel} Contemporary Galleries, Waterfront Walk & Taverns`,
      vibe: `Modern design districts paired with scenic promenades and evening gastronomy in ${cityLabel}.`,
      stops: [
        {
          name: pois[3]?.name || `${cityLabel} Modern & Contemporary Art Center`,
          desc: `Explore avant-garde exhibitions, architectural installations, and sculpture courtyards.`,
          cat: 'Art & Museums' as StopCategory,
          dLat: -0.0085,
          dLng: 0.0064,
          hours: '10:00-19:30',
          cost: 16,
          indoor: true,
        },
        {
          name: `${cityLabel} Culinary Alley & Roasting House`,
          desc: `Taste specialty coffee, freshly baked flatbreads, and savory street plates.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: -0.0032,
          dLng: 0.0092,
          hours: '08:30-21:30',
          cost: 18,
          indoor: true,
        },
        {
          name: `${cityLabel} Riverside & Evening Promenade`,
          desc: `Unwind along ${cityLabel}’s scenic promenade lined with historic lamps and lively terraces.`,
          cat: 'Nature & Parks' as StopCategory,
          dLat: 0.0042,
          dLng: 0.0115,
          hours: '06:00-23:00',
          cost: 0,
          indoor: false,
        },
        {
          name: `${cityLabel} Courtyard Supper Club & Cultural Salon`,
          desc: `Savor slow-cooked regional dinner dishes accompanied by traditional acoustic music.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: 0.0082,
          dLng: -0.0042,
          hours: '12:00-23:00',
          cost: 26,
          indoor: true,
        },
      ],
    },
    {
      title: `${cityLabel} Citadel Courtyards, Antique Lanes & Tasting Menu`,
      vibe: `Hidden architectural courtyards and neighborhood culinary institutions in ${cityLabel}.`,
      stops: [
        {
          name: pois[4]?.name || `${cityLabel} Royal Citadel & Cloisters`,
          desc: `Tour preserved stone cloisters, vaulted halls, and panoramic ramparts.`,
          cat: 'History & Culture' as StopCategory,
          dLat: 0.0112,
          dLng: 0.0034,
          hours: '08:30-18:30',
          cost: 14,
          indoor: true,
        },
        {
          name: `${cityLabel} Vintage & Spice Passage`,
          desc: `Explore historic covered passages stocked with regional spices, ceramics, and rare books.`,
          cat: 'Shopping & Markets' as StopCategory,
          dLat: 0.0074,
          dLng: -0.0052,
          hours: '09:00-20:00',
          cost: 20,
          indoor: true,
        },
        {
          name: `${cityLabel} Terraced Orchard & Spring Sanctuary`,
          desc: `Walk tranquil spring-fed garden paths shaded by walnut, cypress, and pomegranate trees.`,
          cat: 'Nature & Parks' as StopCategory,
          dLat: -0.0118,
          dLng: 0.0078,
          hours: '07:30-19:30',
          cost: 4,
          indoor: false,
        },
        {
          name: `${cityLabel} Heritage Cellar & Regional Tasting Table`,
          desc: `Toast the journey with a curated regional tasting flight and traditional specialties.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: 0.0015,
          dLng: -0.0068,
          hours: '12:30-23:00',
          cost: 30,
          indoor: true,
        },
      ],
    },
    {
      title: `${cityLabel} Hilltop Sanctuary, Local Bakery & Farewell Promenade`,
      vibe: `A restorative final day celebrating ${cityLabel}’s neighborhood cafes and scenic overlooks.`,
      stops: [
        {
          name: pois[5]?.name || `${cityLabel} Hilltop Pavilion & Park`,
          desc: `Enjoy morning views across ${cityLabel} from terraced gardens.`,
          cat: 'Nature & Parks' as StopCategory,
          dLat: -0.0105,
          dLng: -0.0044,
          hours: '07:00-20:00',
          cost: 5,
          indoor: false,
        },
        {
          name: `${cityLabel} Historic Boulangerie & Confectionery`,
          desc: `Pick up signature regional pastries, wild honey, and artisan confections to bring home.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: -0.0052,
          dLng: 0.0016,
          hours: '07:30-20:30',
          cost: 15,
          indoor: true,
        },
        {
          name: `${cityLabel} Cultural Foundation & Sculpture Court`,
          desc: `Explore a serene courtyard gallery in central ${cityLabel}.`,
          cat: 'Art & Museums' as StopCategory,
          dLat: 0.0034,
          dLng: 0.0046,
          hours: '09:30-18:30',
          cost: 12,
          indoor: true,
        },
        {
          name: `${cityLabel} Farewell Rooftop & Lantern Terrace`,
          desc: `Celebrate the final evening overlooking the illuminated landmarks of ${cityLabel}.`,
          cat: 'Food & Dining' as StopCategory,
          dLat: 0.0062,
          dLng: -0.0088,
          hours: '12:00-23:00',
          cost: 28,
          indoor: false,
        },
      ],
    },
  ];

  const days: TripDay[] = Array.from({ length: requestedDays }, (_, i) => {
    const cfg = dayThemeConfigs[i % dayThemeConfigs.length];
    const times = [
      ['09:00', '10:45'],
      ['11:30', '13:15'],
      ['14:00', '15:45'],
      ['16:30', '18:30'],
    ];
    const activeStops =
      params.personality === 'Slow Traveler'
        ? cfg.stops.slice(0, 3)
        : cfg.stops;
    return {
      dayNumber: i + 1,
      date: getDate(i),
      title: cfg.title,
      mysteryModeEnabled: false,
      revealedStopCount: 3,
      dailyBriefing: {
        vibeSummary: cfg.vibe,
        etiquetteTip: `Greet local hosts in ${cityLabel} warmly and keep small bills handy for neighborhood markets.`,
        wearAdvice: `Comfortable walking shoes and adaptable layers suited for ${cityLabel}.`,
      },
      stops: activeStops.map((st, sIdx) => ({
        id: `stop-dyn-${i + 1}-${sIdx + 1}-${Date.now()}`,
        name: st.name,
        description: st.desc,
        category: st.cat,
        startTime: times[sIdx][0],
        endTime: times[sIdx][1],
        durationMinutes: 105,
        travelFromPrevMinutes: 0,
        distanceFromPrevKm: 0,
        openingHours: st.hours,
        estimatedCost: st.cost,
        lat: Number((cLat + st.dLat).toFixed(5)),
        lng: Number((cLng + st.dLng).toFixed(5)),
        isIndoor: st.indoor,
        mysteryClue: `A signature ${st.cat.toLowerCase()} highlight in ${cityLabel}.`,
        isCompleted: false,
        upvotes: ['user-traveler-1'],
        downvotes: [],
        comments: [],
      })),
    };
  });

  const { accommodation, dailyTransport } =
    buildRecommendedAccommodationAndTransit({
      destination: cityLabel,
      country: countryLabel,
      currency,
      centerLat: cLat,
      centerLng: cLng,
      daysCount: requestedDays,
      personality: params.personality,
      totalBudget: effectiveBudget,
    });
  const profiledDays = applyPersonalityProfileToDays(days, {
    destination: cityLabel,
    country: countryLabel,
    currency,
    personality: params.personality,
    totalBudget: effectiveBudget,
    accommodationCost: accommodation.totalStayCost,
    transportCost: dailyTransport.totalTransportCost,
  });

  return {
    destination: cityLabel,
    country: countryLabel,
    centerLat: cLat,
    centerLng: cLng,
    title: `${cityLabel} ${params.personality} Getaway`,
    accommodation,
    dailyTransport,
    days: groundAndEnrichDays(profiledDays, params.verifiedPlaces, cLat, cLng),
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
                : `${trip.destination} Covered Heritage Arcade & Cultural Salon`,
            description:
              'Replaced outdoor stop with a sheltered, atmospheric indoor cultural venue with warm tea/coffee service.',
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

    assistantReply = `I've updated the ${trip.destination} itinerary for rainy conditions by replacing exposed outdoor stops with sheltered indoor cultural venues and covered arcades while keeping your schedule and budget intact.`;
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
          : `${trip.destination} Artisanal Gastronomic Market`,
        description:
          'Vibrant neighborhood market featuring regional delicacies, artisan cheeses, and freshly prepared street plates.',
        category: 'Food & Dining',
        estimatedCost: 18,
        openingHours: '08:00-20:00',
        isIndoor: true,
      };
      diffSummary.push(
        `Day ${day.dayNumber}: Swapped "${oldStop.name}" for "${day.stops[idx].name}" (${formatCurrency(18, trip.currency)})`
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
            `Day ${day.dayNumber}: Reduced "${stop.name}" cost from ${formatCurrency(oldCost, trip.currency)} to ${formatCurrency(stop.estimatedCost, trip.currency)} via local pass / off-peak entry`
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
          : `Windproof Evening Jacket for ${trip.destination}`,
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
      reason: `Essential for walking historic quarters across ${trip.destination}.`,
      packed: true,
    },
    {
      id: 'pack-3',
      name: 'Lightweight Cotton Scarf / Shawl',
      category: 'Clothing',
      quantity: 1,
      reason: 'Useful for religious heritage sites and breezy evenings.',
      packed: false,
    },
    {
      id: 'pack-4',
      name: 'Breathable Merino Base Layers',
      category: 'Clothing',
      quantity: 4,
      reason: `Ideal for ${trip.days.length}-day temperature swings in ${trip.destination}.`,
      packed: false,
    },
    {
      id: 'pack-5',
      name: 'Passport + Digital Ticket Backups',
      category: 'Documents & Money',
      quantity: 1,
      reason: 'International entry and timed museum ticket verification.',
      packed: true,
    },
    {
      id: 'pack-6',
      name: 'Zero-FX Fee Contactless Card & Local Cash',
      category: 'Documents & Money',
      quantity: 1,
      reason: 'Needed for metro transit cards and neighborhood market stalls.',
      packed: true,
    },
    {
      id: 'pack-7',
      name: 'Universal Power Adapter',
      category: 'Electronics',
      quantity: 1,
      reason: `Standard power sockets used in ${trip.destination}.`,
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
      reason: 'UV protection during outdoor park and plaza walks.',
      packed: false,
    },
    {
      id: 'pack-11',
      name: 'Foldable Canvas Market Tote',
      category: 'Activity-Specific Gear',
      quantity: 1,
      reason: `Tailored for your ${trip.personality} market stops in ${trip.destination}.`,
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
      conditionSummary: 'Crisp sunshine with light breeze',
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
      conditionSummary: 'Scattered afternoon showers',
    },
    {
      date: fmt(3),
      tempMaxC: 18,
      tempMinC: 11,
      precipitationProbability: 10,
      conditionSummary: 'Clear golden skies',
    },
    {
      date: fmt(4),
      tempMaxC: 19,
      tempMinC: 12,
      precipitationProbability: 10,
      conditionSummary: 'Sunny and mild',
    },
  ];
}

export function buildDefaultCompromiseResult(
  submissions: CompromiseSubmission[],
  trip?: Trip
): CompromiseResult {
  const allStopNames =
    trip?.days.flatMap((d) => d.stops.map((s) => s.name)) || [];
  const currency = trip?.currency || 'USD';
  return {
    summary:
      'Balanced culinary market priorities with architectural landmarks and budget guardrails by pairing morning museum/heritage visits with authentic, high-value neighborhood eateries and scenic parks.',
    fairnessScore: 94,
    resolutions: submissions.map((sub, idx) => ({
      participantName: sub.userName,
      howWishWasIncluded:
        idx === 0
          ? `Honored "${sub.personalWish}" by anchoring lunches around authentic local markets and historic culinary institutions.`
          : `Honored "${sub.personalWish}" by scheduling architectural landmarks, art collections, and sunset viewpoints within ${formatCurrency(sub.dailyBudgetComfort, currency)}/day.`,
      assignedStops:
        allStopNames.length >= 4
          ? idx === 0
            ? allStopNames.filter((_, i) => i % 2 === 1).slice(0, 3)
            : allStopNames.filter((_, i) => i % 2 === 0).slice(0, 3)
          : [
              'Hagia Sophia Grand Mosque',
              'Spice Bazaar (Misir Carsisi)',
              'Galata Tower Panoramic Deck',
            ],
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function buildDefaultDiaryStory(
  trip: Trip,
  notes: DiaryMemoryNote[]
): DiaryStory {
  const stopNames = trip.days.flatMap((d) => d.stops.map((s) => s.name));
  return {
    title: `Chronicles of ${trip.destination}: A ${trip.personality} Journey`,
    subtitle: `A ${trip.days.length}-day exploration of ${trip.destination}, ${trip.country} (${trip.startDate} – ${trip.endDate})`,
    narrativeMarkdown: `Morning light welcomed us to ${trip.destination} as our ${trip.days.length}-day journey began at ${stopNames[0] || trip.destination}. Following a ${trip.personality.toLowerCase()} rhythm, each neighborhood revealed its distinct character through architecture, conversation, and regional flavors.\n\nAcross the following days, stops at ${stopNames.slice(1, 5).join(', ')} created a seamless balance between iconic cultural heritage and unhurried neighborhood discoveries.\n\n${
      notes.length > 0
        ? notes
            .map(
              (n) =>
                `At ${n.stopName} on Day ${n.dayNumber}, ${n.authorName} noted: "${n.caption}"`
            )
            .join('\n\n')
        : ''
    }`,
    highlights: stopNames.slice(0, 4).map((name, i) => `Day ${Math.min(trip.days.length, i + 1)} highlight at ${name}`),
    closingReflection: `More than a checklist of monuments, this ${trip.destination} itinerary gave us the space to experience the living rhythm of the city.`,
    generatedAt: new Date().toISOString(),
  };
}

export function createSeedTrips(): Trip[] {
  const istanbulTemplate = buildFallbackCityTemplate({
    destination: 'Istanbul',
    startDate: '2026-11-12',
    daysCount: 4,
    personality: 'Foodie',
    verifiedPlaces: SEED_VERIFIED_PLACES,
  });
  const istanbulDays = istanbulTemplate.days;
  const weather = buildDefaultWeatherForecast('2026-11-12').slice(0, 4);
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
    totalBudget: 1350,
    currency: 'USD',
    personality: 'Foodie',
    verifiedPlaces: SEED_VERIFIED_PLACES,
    accommodationCost: istanbulTemplate.accommodation.totalStayCost,
    transportCost: istanbulTemplate.dailyTransport.totalTransportCost,
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
    totalBudget: 1350,
    currency: 'USD',
    interests: [
      'Food & Dining',
      'History & Culture',
      'Shopping & Markets',
      'Art & Museums',
    ],
    personality: 'Foodie',
    accommodation: istanbulTemplate.accommodation,
    dailyTransport: istanbulTemplate.dailyTransport,
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
    compromiseResult: undefined,
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

  trip1.compromiseResult = buildDefaultCompromiseResult(submissions, trip1);
  trip1.packingList = buildDefaultPackingList(trip1, weather);
  trip1.diaryStory = buildDefaultDiaryStory(trip1, diaryNotes);

  // Second seeded trip: Madrid
  const madridTemplate = buildFallbackCityTemplate({
    destination: 'Madrid',
    startDate: '2026-11-20',
    daysCount: 3,
    personality: 'Foodie',
    verifiedPlaces: SEED_VERIFIED_PLACES,
  });
  const madridValidation = validateTripSchedule({
    days: madridTemplate.days,
    totalBudget: 1250,
    currency: 'EUR',
    personality: 'Foodie',
    verifiedPlaces: SEED_VERIFIED_PLACES,
    accommodationCost: madridTemplate.accommodation.totalStayCost,
    transportCost: madridTemplate.dailyTransport.totalTransportCost,
  });

  const trip2: Trip = {
    id: 'trip-madrid-2026',
    title: 'Madrid Golden Triangle of Art & Tapas',
    destination: 'Madrid',
    country: 'Spain',
    centerLat: 40.4168,
    centerLng: -3.7038,
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    travelersCount: 2,
    totalBudget: 1250,
    currency: 'EUR',
    interests: ['Food & Dining', 'Art & Museums', 'History & Culture'],
    personality: 'Foodie',
    accommodation: madridTemplate.accommodation,
    dailyTransport: madridTemplate.dailyTransport,
    inviteCode: 'MAD-2026-77M',
    ownerId: 'user-traveler-1',
    collaboratorIds: ['user-buddy-1'],
    days: madridTemplate.days,
    actualExpenses: [
      {
        id: 'exp-mad-1',
        title: 'Barrio de las Letras Boutique Hotel',
        category: 'Accommodation',
        amount: 340,
        date: '2026-11-20',
        paidBy: 'Aria Vance',
      },
      {
        id: 'exp-mad-2',
        title: 'Paseo del Arte Museum Pass & San Miguel Tapas',
        category: 'Food & Dining',
        amount: 78,
        date: '2026-11-20',
        paidBy: 'Liam Chen',
      },
    ],
    packingList: [],
    weatherForecast: buildDefaultWeatherForecast('2026-11-20').slice(0, 3),
    compromiseSubmissions: [],
    diaryNotes: [],
    chatHistory: [
      {
        id: 'chat-mad-1',
        sender: 'assistant',
        authorName: 'AI Trip Planner',
        text: 'Your Madrid Golden Triangle of Art & Tapas itinerary is ready and verified with real Spanish coordinates.',
        timestamp: '2026-11-02T09:00:00Z',
        promptVersion: 'v2.3.1',
      },
    ],
    validation: madridValidation,
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
    model: 'gemini-3.8-flash',
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
    model: 'gemini-3.8-flash',
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
    model: 'gemini-3.8-flash',
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
    model: 'gemini-3.8-flash',
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
