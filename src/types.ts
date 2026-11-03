export type UserRole = 'traveler' | 'buddy' | 'admin';

export type TravelPersonality =
  | 'Foodie'
  | 'Adventurer'
  | 'Slow Traveler'
  | 'Luxury'
  | 'Backpacker';

export type StopCategory =
  | 'Food & Dining'
  | 'History & Culture'
  | 'Nature & Parks'
  | 'Art & Museums'
  | 'Shopping & Markets'
  | 'Nightlife & Entertainment'
  | 'Transit & Check-in';

export type ExpenseCategory =
  | 'Accommodation'
  | 'Food & Dining'
  | 'Transport'
  | 'Activities & Tickets'
  | 'Shopping & Misc';

export type PackingCategory =
  | 'Clothing'
  | 'Documents & Money'
  | 'Toiletries & Health'
  | 'Electronics'
  | 'Activity-Specific Gear';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface StopComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface TripStop {
  id: string;
  name: string;
  description: string;
  category: StopCategory;
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  durationMinutes: number;
  travelFromPrevMinutes: number;
  distanceFromPrevKm: number;
  openingHours: string; // e.g. "09:00-18:00" or "24 Hours"
  estimatedCost: number;
  lat: number;
  lng: number;
  isIndoor: boolean;
  verifiedPlaceId?: string;
  mysteryClue: string;
  isCompleted?: boolean;
  upvotes: string[]; // userIds
  downvotes: string[]; // userIds
  comments: StopComment[];
}

export interface DailyBriefing {
  vibeSummary: string;
  etiquetteTip: string;
  wearAdvice: string;
}

export interface TripDay {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title: string;
  mysteryModeEnabled: boolean;
  revealedStopCount: number;
  dailyBriefing: DailyBriefing;
  stops: TripStop[];
}

export interface BudgetExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidBy: string;
  note?: string;
}

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  reason: string;
  packed: boolean;
}

export interface WeatherForecastDay {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
  conditionSummary: string;
}

export interface CompromiseSubmission {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  mustHaveInterests: string[];
  preferredPace: 'Relaxed' | 'Balanced' | 'Packed';
  dailyBudgetComfort: number;
  personalWish: string;
  submittedAt: string;
}

export interface CompromiseResolutionItem {
  participantName: string;
  howWishWasIncluded: string;
  assignedStops: string[];
}

export interface CompromiseResult {
  summary: string;
  fairnessScore: number;
  resolutions: CompromiseResolutionItem[];
  generatedAt: string;
}

export interface DiaryMemoryNote {
  id: string;
  stopId: string;
  stopName: string;
  dayNumber: number;
  authorName: string;
  caption: string;
  photoDataUrl: string;
  mood: string;
  createdAt: string;
}

export interface DiaryStory {
  title: string;
  subtitle: string;
  narrativeMarkdown: string;
  highlights: string[];
  closingReflection: string;
  generatedAt: string;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning';
  type:
    | 'time_overlap'
    | 'opening_hours'
    | 'tight_transit'
    | 'invalid_coordinates'
    | 'budget_overrun'
    | 'pacing_warning';
  dayNumber?: number;
  stopId?: string;
  stopName?: string;
  message: string;
  suggestion: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  totalEstimatedCost: number;
  totalStops: number;
  verifiedStopsCount: number;
  issues: ValidationIssue[];
  checkedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  authorName: string;
  text: string;
  timestamp: string;
  diffSummary?: string[];
  promptVersion?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  centerLat: number;
  centerLng: number;
  startDate: string;
  endDate: string;
  travelersCount: number;
  totalBudget: number;
  currency: string;
  interests: string[];
  personality: TravelPersonality;
  inviteCode: string;
  ownerId: string;
  collaboratorIds: string[];
  days: TripDay[];
  actualExpenses: BudgetExpense[];
  packingList: PackingItem[];
  weatherForecast: WeatherForecastDay[];
  compromiseSubmissions: CompromiseSubmission[];
  compromiseResult?: CompromiseResult;
  diaryNotes: DiaryMemoryNote[];
  diaryStory?: DiaryStory;
  chatHistory: ChatMessage[];
  validation: ScheduleValidationResult;
  updatedAt: string;
}

export interface VerifiedPlace {
  id: string;
  city: string;
  country: string;
  name: string;
  category: StopCategory;
  lat: number;
  lng: number;
  openingHours: string;
  typicalCostUsd: number;
  isIndoor: boolean;
  verifiedBy: string;
  updatedAt: string;
}

export interface AiUsageLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  feature:
    | 'itinerary_generation'
    | 'chat_replan'
    | 'packing_list'
    | 'group_compromise'
    | 'travel_diary';
  model: string;
  promptVersion: string;
  latencyMs: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  validationPassed: boolean;
  validationIssueCount: number;
  status: 'success' | 'fallback' | 'cached' | 'blocked' | 'rate_limited' | 'error';
  promptSnippet: string;
  notes?: string;
}
