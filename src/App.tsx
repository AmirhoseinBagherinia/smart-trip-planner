import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  MessageSquare,
  Plus,
  Printer,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Unlock,
  Wand2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { BudgetPackingView } from './components/BudgetPackingView.tsx';
import { CollaborationCompromiseView } from './components/CollaborationCompromiseView.tsx';
import { CreateTripModal } from './components/CreateTripModal.tsx';
import { PrintItineraryModal } from './components/PrintItineraryModal.tsx';
import { RouteMap } from './components/RouteMap.tsx';
import { TravelDiaryView } from './components/TravelDiaryView.tsx';
import {
  AiUsageLog,
  ExpenseCategory,
  PackingItem,
  StopCategory,
  TravelPersonality,
  Trip,
  TripStop,
  User,
  UserRole,
  VerifiedPlace,
} from './types.ts';
import { formatCurrency, getCurrencySymbol } from './utils/currency.ts';

type ActiveSection =
  | 'workspace'
  | 'budget_packing'
  | 'collaboration'
  | 'diary'
  | 'admin';

const LOCAL_STORAGE_CACHE_KEY = 'smart_trip_planner_offline_cache_v1';

const SMART_REPLAN_ACTIONS = [
  {
    label: 'Rainy Day Alternative',
    prompt:
      "It's raining today, replace outdoor stops with sheltered indoor alternatives within budget.",
  },
  {
    label: 'Make Day Less Tiring',
    prompt:
      'Make Day 2 less tiring with fewer stops and a more relaxed morning start.',
  },
  {
    label: 'Swap for Local Food Market',
    prompt:
      'Swap the museum or cultural stop on Day 1 for an authentic local food market.',
  },
  {
    label: 'Reduce Budget by 20%',
    prompt:
      'Reduce total itinerary stop costs by 20% using high-value neighborhood options.',
  },
];

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('');
  const [verifiedPlaces, setVerifiedPlaces] = useState<VerifiedPlace[]>([]);
  const [aiLogs, setAiLogs] = useState<AiUsageLog[]>([]);
  const [aiStatus, setAiStatus] = useState<{
    apiKeyConfigured: boolean;
    activeModel: string;
    mode: 'live_connected' | 'fallback_active' | 'ready';
    lastError: string | null;
    lastCheckedAt: string;
  } | null>(null);
  const [activeSection, setActiveSection] =
    useState<ActiveSection>('workspace');
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // Loading & Offline states
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [statusBanner, setStatusBanner] = useState<{
    type: 'info' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Modals
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Action pending states
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [isChatMutating, setIsChatMutating] = useState(false);
  const [isGeneratingPacking, setIsGeneratingPacking] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);

  // Quick free-text bar in workspace
  const [quickPromptText, setQuickPromptText] = useState('');

  // Chat planner state
  const [chatInput, setChatInput] = useState('');
  const [latestDiffSummary, setLatestDiffSummary] = useState<string[] | null>(
    null
  );

  // Add / Edit Stop state
  const [showAddStopForm, setShowAddStopForm] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  const [newStopDesc, setNewStopDesc] = useState('');
  const [newStopCategory, setNewStopCategory] =
    useState<StopCategory>('Food & Dining');
  const [newStopStart, setNewStopStart] = useState('18:00');
  const [newStopEnd, setNewStopEnd] = useState('19:30');
  const [newStopHours, setNewStopHours] = useState('09:00-22:00');
  const [newStopCost, setNewStopCost] = useState('20');
  const [newStopIndoor, setNewStopIndoor] = useState(true);

  // Edit existing stop inline
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editHours, setEditHours] = useState('');

  // Inline comment input on workspace stop card
  const [stopCommentText, setStopCommentText] = useState<
    Record<string, string>
  >({});

  // Sync online/offline listener
  useEffect(() => {
    const onOnline = () => setIsOfflineMode(false);
    const onOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load initial data from backend or localStorage offline cache
  useEffect(() => {
    async function loadInitial() {
      setIsLoadingBootstrap(true);
      try {
        const res = await fetch('/api/bootstrap');
        if (!res.ok) throw new Error('Bootstrap request failed');
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentUser((data.users && data.users[0]) || null);
        setTrips(data.trips || []);
        if (data.trips && data.trips.length > 0) {
          setActiveTripId(data.trips[0].id);
        }
        setVerifiedPlaces(data.verifiedPlaces || []);
        setAiLogs(data.aiLogs || []);
        if (data.aiStatus) {
          setAiStatus(data.aiStatus);
        }

        // Save to LocalStorage for Offline Mode
        localStorage.setItem(
          LOCAL_STORAGE_CACHE_KEY,
          JSON.stringify({
            users: data.users,
            trips: data.trips,
            verifiedPlaces: data.verifiedPlaces,
            aiLogs: data.aiLogs,
            cachedAt: new Date().toISOString(),
          })
        );

        // Check URL for invite code (?invite=...)
        const params = new URLSearchParams(window.location.search);
        const inviteParam = params.get('invite');
        if (inviteParam && data.trips) {
          const found = data.trips.find(
            (t: Trip) =>
              t.inviteCode.toUpperCase() === inviteParam.toUpperCase()
          );
          if (found) {
            setActiveTripId(found.id);
            setStatusBanner({
              type: 'info',
              message: `Opened shared trip "${found.title}" via invite code ${found.inviteCode}.`,
            });
          }
        }
      } catch {
        // Fallback to LocalStorage offline cache
        setIsOfflineMode(true);
        const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          setUsers(cached.users || []);
          setCurrentUser((cached.users && cached.users[0]) || null);
          setTrips(cached.trips || []);
          if (cached.trips && cached.trips.length > 0) {
            setActiveTripId(cached.trips[0].id);
          }
          setVerifiedPlaces(cached.verifiedPlaces || []);
          setAiLogs(cached.aiLogs || []);
        }
      } finally {
        setIsLoadingBootstrap(false);
      }
    }
    loadInitial();
  }, []);

  // Keep LocalStorage synced whenever trips update
  useEffect(() => {
    if (trips.length > 0 && users.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_CACHE_KEY,
        JSON.stringify({
          users,
          trips,
          verifiedPlaces,
          aiLogs,
          cachedAt: new Date().toISOString(),
        })
      );
    }
  }, [trips, users, verifiedPlaces, aiLogs]);

  const activeTrip =
    trips.find((t) => t.id === activeTripId) || trips[0] || null;
  const activeDay =
    activeTrip?.days.find((d) => d.dayNumber === selectedDayNum) ||
    activeTrip?.days[0] ||
    null;

  const updateTripInState = (updated: Trip) => {
    setTrips((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      if (exists) {
        return prev.map((t) => (t.id === updated.id ? updated : t));
      }
      return [updated, ...prev];
    });
  };

  // API Helper that attaches current user header
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    if (isOfflineMode) {
      throw new Error(
        'Offline Mode is active. Disable Offline Mode in the workspace bar to sync changes with the server.'
      );
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (currentUser) {
      headers['x-user-id'] = currentUser.id;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (data.aiLogs) {
      setAiLogs(data.aiLogs);
    }
    if (data.aiStatus) {
      setAiStatus(data.aiStatus);
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  };

  // UC1 & UC2: Create Trip
  const handleCreateTrip = async (payload: {
    destination: string;
    startDate: string;
    endDate: string;
    travelersCount: number;
    totalBudget: number;
    currency: string;
    interests: string[];
    personality: TravelPersonality;
    freeTextPrompt: string;
  }) => {
    setIsGeneratingTrip(true);
    setStatusBanner(null);
    try {
      const data = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      updateTripInState(data.trip);
      setActiveTripId(data.trip.id);
      setSelectedDayNum(1);
      setSelectedStopId(null);
      setShowCreateTripModal(false);
      setActiveSection('workspace');
      setStatusBanner({
        type: 'info',
        message: `Generated ${data.trip.days.length}-day validated itinerary for ${data.trip.destination} (${data.trip.personality} mode).`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Could not generate itinerary.',
      });
      throw err;
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  // Quick Free-Text bar submission in workspace
  const handleQuickPromptGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPromptText.trim() || !activeTrip) return;
    setIsGeneratingTrip(true);
    setStatusBanner(null);
    try {
      const cityMatch =
        quickPromptText.match(
          /\b(?:in|to|for|visit|visiting)\s+([A-Z][a-zA-Z\s-]{2,24}?)(?:,|\.|;|\s+(?:for|with|on|in|relaxed|food|history|art|nature|budget|luxury|slow|adventure|medium|low|high|and)\b|$)/i
        ) ||
        quickPromptText.match(
          /\b(Madrid|Shiraz|Istanbul|Paris|Tokyo|Rome|Barcelona|Kyoto|London|Lisbon|Vienna|Prague|Seoul|Amsterdam|Cairo|Athens|Marrakech|Florence|Venice|Berlin)\b/i
        );
      const targetCity = cityMatch
        ? cityMatch[1].trim()
        : activeTrip.destination;
      const data = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          destination: targetCity,
          startDate: activeTrip.startDate,
          endDate: activeTrip.endDate,
          travelersCount: activeTrip.travelersCount,
          totalBudget: activeTrip.totalBudget,
          currency: activeTrip.currency,
          interests: activeTrip.interests,
          personality: activeTrip.personality,
          freeTextPrompt: quickPromptText.trim(),
        }),
      });
      updateTripInState(data.trip);
      setActiveTripId(data.trip.id);
      setSelectedDayNum(1);
      setSelectedStopId(null);
      setQuickPromptText('');
      setStatusBanner({
        type: 'info',
        message: `Created "${data.trip.title}" from your free-text prompt and verified all stop coordinates.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to generate from prompt.',
      });
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  // UC3: Save modified days/stops & run Schedule Validator
  const saveUpdatedDays = async (
    nextDays: Trip['days'],
    options?: { autoFixTimings?: boolean; personality?: TravelPersonality }
  ) => {
    if (!activeTrip) return;
    try {
      const data = await apiFetch(`/api/trips/${activeTrip.id}/days`, {
        method: 'PUT',
        body: JSON.stringify({
          days: nextDays,
          autoFixTimings: options?.autoFixTimings,
          personality: options?.personality,
        }),
      });
      updateTripInState(data.trip);
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Could not update schedule.',
      });
    }
  };

  const handleReorderStop = async (
    dayNumber: number,
    stopIdx: number,
    direction: 'up' | 'down'
  ) => {
    if (!activeTrip) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const day = clonedDays.find((d: any) => d.dayNumber === dayNumber);
    if (!day) return;
    const targetIdx = direction === 'up' ? stopIdx - 1 : stopIdx + 1;
    if (targetIdx < 0 || targetIdx >= day.stops.length) return;

    const temp = day.stops[stopIdx];
    day.stops[stopIdx] = day.stops[targetIdx];
    day.stops[targetIdx] = temp;

    await saveUpdatedDays(clonedDays);
  };

  const handleMoveStopToDay = async (
    fromDayNum: number,
    stopId: string,
    toDayNum: number
  ) => {
    if (!activeTrip || fromDayNum === toDayNum) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const fromDay = clonedDays.find((d: any) => d.dayNumber === fromDayNum);
    const toDay = clonedDays.find((d: any) => d.dayNumber === toDayNum);
    if (!fromDay || !toDay) return;

    const idx = fromDay.stops.findIndex((s: TripStop) => s.id === stopId);
    if (idx === -1) return;
    const [moved] = fromDay.stops.splice(idx, 1);
    toDay.stops.push(moved);

    await saveUpdatedDays(clonedDays, { autoFixTimings: true });
    setSelectedDayNum(toDayNum);
  };

  const handleDeleteStop = async (dayNumber: number, stopId: string) => {
    if (!activeTrip) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const day = clonedDays.find((d: any) => d.dayNumber === dayNumber);
    if (!day) return;
    day.stops = day.stops.filter((s: TripStop) => s.id !== stopId);
    await saveUpdatedDays(clonedDays);
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !activeDay || !newStopName.trim()) return;

    try {
      // Geocode via Verified Catalog or Nominatim
      const geoRes = await fetch(
        `/api/geocode?q=${encodeURIComponent(
          newStopName.trim()
        )}&city=${encodeURIComponent(activeTrip.destination)}`
      );
      const geo = geoRes.ok
        ? await geoRes.json()
        : {
            lat: activeTrip.centerLat + 0.006,
            lng: activeTrip.centerLng + 0.006,
            openingHours: newStopHours,
          };

      const newStop: TripStop = {
        id: `stop-custom-${Date.now()}`,
        name: newStopName.trim(),
        description:
          newStopDesc.trim() ||
          `Custom ${newStopCategory} stop added to Day ${activeDay.dayNumber}.`,
        category: newStopCategory,
        startTime: newStopStart || '18:00',
        endTime: newStopEnd || '19:30',
        durationMinutes: 90,
        travelFromPrevMinutes: 15,
        distanceFromPrevKm: 1.2,
        openingHours: newStopHours || geo.openingHours || '09:00-22:00',
        estimatedCost: Math.max(0, parseFloat(newStopCost) || 20),
        lat: Number(geo.lat || activeTrip.centerLat),
        lng: Number(geo.lng || activeTrip.centerLng),
        isIndoor: newStopIndoor,
        verifiedPlaceId: geo.verifiedPlaceId,
        mysteryClue: `An added local discovery in ${activeTrip.destination}.`,
        isCompleted: false,
        upvotes: currentUser ? [currentUser.id] : [],
        downvotes: [],
        comments: [],
      };

      const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
      const day = clonedDays.find(
        (d: any) => d.dayNumber === activeDay.dayNumber
      );
      day.stops.push(newStop);

      await saveUpdatedDays(clonedDays);
      setNewStopName('');
      setNewStopDesc('');
      setShowAddStopForm(false);
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to add stop.',
      });
    }
  };

  const handleSaveInlineStopEdit = async (
    dayNumber: number,
    stopId: string
  ) => {
    if (!activeTrip) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const day = clonedDays.find((d: any) => d.dayNumber === dayNumber);
    if (!day) return;
    const stop = day.stops.find((s: TripStop) => s.id === stopId);
    if (!stop) return;

    stop.startTime = editStart || stop.startTime;
    stop.endTime = editEnd || stop.endTime;
    stop.estimatedCost = Math.max(0, parseFloat(editCost) || 0);
    stop.openingHours = editHours || stop.openingHours;

    await saveUpdatedDays(clonedDays);
    setEditingStopId(null);
  };

  // Creative Feature 2: "Surprise Me" Mystery Mode toggle & Reveal Next Stop
  const handleToggleMysteryMode = async (dayNumber: number) => {
    if (!activeTrip) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const day = clonedDays.find((d: any) => d.dayNumber === dayNumber);
    if (!day) return;
    day.mysteryModeEnabled = !day.mysteryModeEnabled;
    if (day.mysteryModeEnabled && (!day.revealedStopCount || day.revealedStopCount < 1)) {
      day.revealedStopCount = 1;
    }
    await saveUpdatedDays(clonedDays);
  };

  const handleRevealNextMysteryStop = async (dayNumber: number) => {
    if (!activeTrip) return;
    const clonedDays = JSON.parse(JSON.stringify(activeTrip.days));
    const day = clonedDays.find((d: any) => d.dayNumber === dayNumber);
    if (!day) return;
    const currentRevealed = day.revealedStopCount || 1;
    if (day.stops[currentRevealed - 1]) {
      day.stops[currentRevealed - 1].isCompleted = true;
    }
    day.revealedStopCount = Math.min(day.stops.length, currentRevealed + 1);
    await saveUpdatedDays(clonedDays);
  };

  // UC4: Chat with the Planner / Smart Re-plan
  const handleSendChatReplan = async (messageText: string) => {
    if (!activeTrip || !messageText.trim()) return;
    setIsChatMutating(true);
    setStatusBanner(null);
    try {
      const data = await apiFetch(`/api/trips/${activeTrip.id}/chat-replan`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText.trim() }),
      });
      updateTripInState(data.trip);
      setLatestDiffSummary(data.diffSummary || null);
      setChatInput('');
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Planner mutation failed.',
      });
    } finally {
      setIsChatMutating(false);
    }
  };

  if (isLoadingBootstrap) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 max-w-[1440px] mx-auto space-y-6">
        <div className="h-14 bg-slate-200/70 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[520px] bg-slate-200/70 rounded-xl animate-pulse" />
          <div className="lg:col-span-5 h-[520px] bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* TOP BAR CONTRACT: Strictly 3 zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('workspace');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Smart Trip Planner
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#workspace"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('workspace');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'workspace'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Itinerary Workspace
            </a>
            <a
              href="#budget"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('budget_packing');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'budget_packing'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Budget & Packing
            </a>
            <a
              href="#collaboration"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('collaboration');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'collaboration'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Group Compromise
            </a>
            <a
              href="#diary"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('diary');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'diary'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Travel Diary
            </a>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('admin');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'admin'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Admin Console
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCreateTripModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              New Trip
            </button>
          </div>
        </div>
      </header>

      {/* SECONDARY WORKSPACE CONTROL BAR (Trip Switcher, Demo Role Switcher, Offline Cache, PDF Export) */}
      <div className="no-print bg-slate-100/80 border-b border-slate-200 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Active Trip Selector & Tagline */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700 shrink-0" />
              <select
                value={activeTrip?.id || ''}
                onChange={(e) => {
                  setActiveTripId(e.target.value);
                  setSelectedDayNum(1);
                }}
                aria-label="Select Active Trip"
                className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.destination} · {t.days.length}d · {formatCurrency(t.totalBudget, t.currency)})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 hidden xl:inline">
              Tell it where. It plans the rest.
            </span>
          </div>

          {/* Demo Role Switcher & Utilities */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Role Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline">
                Role:
              </span>
              {users.slice(0, 4).map((u) => {
                const active = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      if (u.role === 'admin') {
                        setActiveSection('admin');
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`Switch to ${u.name} (${u.role})`}
                  >
                    {u.role === 'traveler' && u.isBlocked
                      ? 'Blocked User'
                      : `${u.role.charAt(0).toUpperCase() + u.role.slice(1)}: ${u.name.split(' ')[0]}`}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-2 py-1 text-xs font-medium text-teal-700 hover:underline whitespace-nowrap shrink-0"
              >
                Sign In / Up
              </button>
            </div>

            {/* Offline Mode Toggle */}
            <button
              onClick={() => setIsOfflineMode((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isOfflineMode
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle Offline LocalStorage Cache Mode"
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  Offline Cache Active
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-teal-700" />
                  Online & Synced
                </>
              )}
            </button>

            {/* Export PDF / Print View */}
            {activeTrip && (
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAV FALLBACK */}
      <div className="no-print flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-slate-200">
        {(
          [
            ['workspace', 'Workspace'],
            ['budget_packing', 'Budget & Packing'],
            ['collaboration', 'Collaborate'],
            ['diary', 'Travel Diary'],
            ['admin', 'Admin'],
          ] as [ActiveSection, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeSection === key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Offline Banner */}
        {isOfflineMode && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Viewing saved trip plans, stops, budgets, and packing lists from local browser storage. Reconnect to Online Mode to run live AI generations.
              </span>
            </div>
            <button
              onClick={() => setIsOfflineMode(false)}
              className="px-3 py-1 text-xs font-semibold bg-amber-800 text-white rounded-md hover:bg-amber-900 whitespace-nowrap shrink-0"
            >
              Reconnect Online
            </button>
          </div>
        )}

        {/* Status / Notification Banner */}
        {statusBanner && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs ${
              statusBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-teal-50/80 border-teal-200 text-teal-900'
            }`}
          >
            <span>{statusBanner.message}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-xs font-semibold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: ITINERARY WORKSPACE (UC1, UC2, UC3, UC4 + Creative Features 1 & 2) */}
        {activeSection === 'workspace' && activeTrip && activeDay && (
          <div className="space-y-6">
            {/* Free-Text AI Prompt Bar (UC2) */}
            <form
              onSubmit={handleQuickPromptGenerate}
              className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 whitespace-nowrap shrink-0">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>AI Free-Text Generator:</span>
              </div>
              <input
                type="text"
                value={quickPromptText}
                onChange={(e) => setQuickPromptText(e.target.value)}
                placeholder='Describe any trip in plain words — e.g., "4 days in Istanbul, relaxed, food and history, medium budget"'
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
              />
              <button
                type="submit"
                disabled={isGeneratingTrip || !quickPromptText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                {isGeneratingTrip
                  ? 'Generating Validated Plan...'
                  : 'Generate from Prompt'}
              </button>
            </form>

            {/* Trip Summary Header & Personality Mode Switcher */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {activeTrip.destination}, {activeTrip.country} · {activeTrip.startDate} to {activeTrip.endDate} · {activeTrip.travelersCount} Travelers · Invite Code: <span className="font-mono font-semibold text-slate-800">{activeTrip.inviteCode}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1">
                    {activeTrip.title}
                  </h1>
                  <div className="text-xs text-slate-600 mt-1 tabular-nums">
                    Full Trip Estimate:{' '}
                    <strong>
                      {formatCurrency(
                        activeTrip.validation.totalTripEstimatedCost ||
                          activeTrip.validation.totalEstimatedCost +
                            (activeTrip.accommodation?.totalStayCost ?? 0) +
                            (activeTrip.dailyTransport?.totalTransportCost ?? 0),
                        activeTrip.currency
                      )}
                    </strong>{' '}
                    (Stops: {formatCurrency(activeTrip.validation.totalEstimatedCost, activeTrip.currency)}
                    {activeTrip.accommodation
                      ? ` · Stay: ${formatCurrency(activeTrip.accommodation.totalStayCost, activeTrip.currency)}`
                      : ''}
                    {activeTrip.dailyTransport
                      ? ` · Transit: ${formatCurrency(activeTrip.dailyTransport.totalTransportCost, activeTrip.currency)}`
                      : ''}
                    ) of{' '}
                    <strong>{formatCurrency(activeTrip.totalBudget, activeTrip.currency)}</strong>{' '}
                    {activeTrip.currency} budget · {activeTrip.validation.verifiedStopsCount} of {activeTrip.validation.totalStops} stops grounded in Verified Catalog
                  </div>
                </div>

                {/* Travel Personality Mode Selector (Creative Feature 1) */}
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">
                    Travel Personality Mode (Shapes Hotel, Transit, Pacing & Pricing):
                  </span>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        'Foodie',
                        'Adventurer',
                        'Slow Traveler',
                        'Luxury',
                        'Backpacker',
                      ] as TravelPersonality[]
                    ).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          saveUpdatedDays(activeTrip.days, { personality: mode })
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          activeTrip.personality === mode
                            ? 'bg-white text-slate-900 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Base Accommodation & Daily Transit Strip */}
              {(activeTrip.accommodation || activeTrip.dailyTransport) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  {activeTrip.accommodation && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-teal-800">
                          Recommended Base Stay · {activeTrip.accommodation.style}
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(activeTrip.accommodation.nightlyRate, activeTrip.currency)}/night · {formatCurrency(activeTrip.accommodation.totalStayCost, activeTrip.currency)} ({activeTrip.accommodation.nights}n)
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {activeTrip.accommodation.name} — {activeTrip.accommodation.neighborhood}
                      </div>
                      <div className="text-slate-500">
                        {activeTrip.accommodation.bookingNote}
                      </div>
                    </div>
                  )}
                  {activeTrip.dailyTransport && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-teal-800">
                          Daily Local Transit ({activeTrip.personality})
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(activeTrip.dailyTransport.dailyCostPerDay, activeTrip.currency)}/day · {formatCurrency(activeTrip.dailyTransport.totalTransportCost, activeTrip.currency)} total
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {activeTrip.dailyTransport.modeSummary}
                      </div>
                      <div className="text-slate-500">
                        {activeTrip.dailyTransport.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SCHEDULE & QUALITY GUARD VALIDATION BANNER */}
            {activeTrip.validation.issues.length > 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Schedule & Quality Guard Detected {activeTrip.validation.issues.length} Schedule Advisory
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      saveUpdatedDays(activeTrip.days, { autoFixTimings: true })
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-800 rounded-lg hover:bg-amber-900 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Fix Schedule Timings
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                  {activeTrip.validation.issues.map((issue) => (
                    <li key={issue.id}>
                      <strong>{issue.message}</strong> — {issue.suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    <strong>Schedule & Quality Guard Verified:</strong> Zero time overlaps, all opening hours respected, realistic transit gaps calculated, and all coordinates verified.
                  </span>
                </div>
                <span className="text-[11px] text-teal-700 tabular-nums hidden sm:inline">
                  Full Est:{' '}
                  {formatCurrency(
                    activeTrip.validation.totalTripEstimatedCost ||
                      activeTrip.validation.totalEstimatedCost +
                        (activeTrip.accommodation?.totalStayCost ?? 0) +
                        (activeTrip.dailyTransport?.totalTransportCost ?? 0),
                    activeTrip.currency
                  )}{' '}
                  / {formatCurrency(activeTrip.totalBudget, activeTrip.currency)}
                </span>
              </div>
            )}

            {/* CONVERSATIONAL AI DIFF NOTIFICATION */}
            {latestDiffSummary && latestDiffSummary.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Planner Applied Live Schedule Mutation
                  </div>
                  <button
                    onClick={() => setLatestDiffSummary(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss Diff
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-slate-200 list-disc list-inside">
                  {latestDiffSummary.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* WORKSPACE 2-COLUMN SPLIT: Left (Days, Briefing, Timeline) + Right (Interactive Map & AI Chat Planner) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN (7 cols): Day Selector, Daily Briefing, Surprise Me Mode & Stop Cards */}
              <div className="lg:col-span-7 space-y-5">
                {/* Day Tabs + Mystery Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg">
                    {activeTrip.days.map((d) => (
                      <button
                        key={d.dayNumber}
                        onClick={() => {
                          setSelectedDayNum(d.dayNumber);
                          setSelectedStopId(null);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap shrink-0 ${
                          activeDay.dayNumber === d.dayNumber
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Day {d.dayNumber} · {d.date.slice(5)}
                      </button>
                    ))}
                  </div>

                  {/* Creative Feature 2: "Surprise Me" Mystery Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleToggleMysteryMode(activeDay.dayNumber)
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        activeDay.mysteryModeEnabled
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {activeDay.mysteryModeEnabled ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          "Surprise Me" Mystery Mode: ON
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          "Surprise Me" Mystery Mode
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowAddStopForm((prev) => !prev)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Stop
                    </button>
                  </div>
                </div>

                {/* AI Daily Briefing Card (AI Core Requirement 4) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                      Day {activeDay.dayNumber}: {activeDay.title}
                    </h2>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {activeDay.date} · {activeDay.stops.length} stops
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="font-semibold text-slate-900 mb-0.5">
                        Daily Vibe Summary
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {activeDay.dailyBriefing.vibeSummary}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="font-semibold text-slate-900 mb-0.5">
                        Local Etiquette & Safety
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {activeDay.dailyBriefing.etiquetteTip}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="font-semibold text-slate-900 mb-0.5">
                        Daily Wear & Packing Tip
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {activeDay.dailyBriefing.wearAdvice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add New Stop Inline Drawer */}
                {showAddStopForm && (
                  <form
                    onSubmit={handleAddStop}
                    className="p-4 rounded-xl bg-white border border-teal-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">
                        Add New Grounded Stop to Day {activeDay.dayNumber}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddStopForm(false)}
                        className="text-xs text-slate-500 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        placeholder="Venue Name (auto-geocoded)"
                        value={newStopName}
                        onChange={(e) => setNewStopName(e.target.value)}
                        className="sm:col-span-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                      />
                      <select
                        value={newStopCategory}
                        onChange={(e) =>
                          setNewStopCategory(e.target.value as StopCategory)
                        }
                        className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                      >
                        <option value="Food & Dining">Food & Dining</option>
                        <option value="History & Culture">
                          History & Culture
                        </option>
                        <option value="Art & Museums">Art & Museums</option>
                        <option value="Nature & Parks">Nature & Parks</option>
                        <option value="Shopping & Markets">
                          Shopping & Markets
                        </option>
                        <option value="Nightlife & Entertainment">
                          Nightlife & Entertainment
                        </option>
                      </select>
                      <input
                        type="text"
                        placeholder="Start (HH:MM)"
                        value={newStopStart}
                        onChange={(e) => setNewStopStart(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg tabular-nums"
                      />
                      <input
                        type="text"
                        placeholder="End (HH:MM)"
                        value={newStopEnd}
                        onChange={(e) => setNewStopEnd(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder={`Est Cost (${getCurrencySymbol(activeTrip.currency)})`}
                        value={newStopCost}
                        onChange={(e) => setNewStopCost(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg tabular-nums"
                      />
                      <input
                        type="text"
                        placeholder="Opening Hours (09:00-21:00)"
                        value={newStopHours}
                        onChange={(e) => setNewStopHours(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Short description..."
                        value={newStopDesc}
                        onChange={(e) => setNewStopDesc(e.target.value)}
                        className="sm:col-span-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={newStopIndoor}
                          onChange={(e) => setNewStopIndoor(e.target.checked)}
                        />
                        Indoor / Covered Stop
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                      >
                        Geocode & Add to Schedule
                      </button>
                    </div>
                  </form>
                )}

                {/* STOP-BY-STOP TIMELINE CARDS */}
                <div className="space-y-3">
                  {activeDay.stops.map((stop, idx) => {
                    const isHiddenMystery =
                      activeDay.mysteryModeEnabled &&
                      idx >= (activeDay.revealedStopCount || 1);
                    const isNextToReveal =
                      activeDay.mysteryModeEnabled &&
                      idx === (activeDay.revealedStopCount || 1);

                    return (
                      <div key={stop.id} className="space-y-2">
                        {/* Transit Leg Indicator between stops */}
                        {idx > 0 && (
                          <div className="flex items-center gap-2 pl-5 text-xs text-slate-500 tabular-nums">
                            <span>↓</span>
                            <span>
                              Transit Leg: {stop.distanceFromPrevKm} km · ~
                              {stop.travelFromPrevMinutes} min travel gap
                            </span>
                          </div>
                        )}

                        {isHiddenMystery ? (
                          /* MYSTERY MODE LOCKED CARD */
                          <div className="p-4 rounded-xl border border-slate-300 bg-slate-900 text-white space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-amber-300 font-medium tabular-nums flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                Stop {idx + 1} · {stop.startTime}–{stop.endTime} · Mystery Stop Locked
                              </div>
                              <span className="text-xs text-slate-400">
                                {stop.category} · Est. {formatCurrency(stop.estimatedCost, activeTrip.currency)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-200 italic">
                              Clue: "{stop.mysteryClue}"
                            </p>
                            {isNextToReveal && (
                              <button
                                onClick={() =>
                                  handleRevealNextMysteryStop(
                                    activeDay.dayNumber
                                  )
                                }
                                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-400 text-slate-950 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Complete Current Stop & Reveal Stop {idx + 1}
                              </button>
                            )}
                          </div>
                        ) : (
                          /* STANDARD REVEALED STOP CARD (Zero-Pill Unboxed Metadata) */
                          <div
                            onClick={() => setSelectedStopId(stop.id)}
                            className={`p-4 rounded-xl border bg-white transition-colors cursor-pointer space-y-3 ${
                              selectedStopId === stop.id
                                ? 'border-teal-700 ring-1 ring-teal-700/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Clean unboxed metadata row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">
                                  0{idx + 1}.
                                </span>
                                <span className="font-mono font-semibold text-teal-800">
                                  {stop.startTime}–{stop.endTime}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{stop.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{formatCurrency(stop.estimatedCost, activeTrip.currency)}</span>
                                <span aria-hidden="true">·</span>
                                <span>Open {stop.openingHours}</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {stop.isIndoor ? 'Indoor' : 'Outdoor'}
                                </span>
                              </div>

                              {/* Reorder, Move Day, Edit, Delete Controls */}
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() =>
                                    handleReorderStop(
                                      activeDay.dayNumber,
                                      idx,
                                      'up'
                                    )
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                                  title="Move stop earlier"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === activeDay.stops.length - 1}
                                  onClick={() =>
                                    handleReorderStop(
                                      activeDay.dayNumber,
                                      idx,
                                      'down'
                                    )
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                                  title="Move stop later"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {activeTrip.days.length > 1 && (
                                  <select
                                    value={activeDay.dayNumber}
                                    onChange={(e) =>
                                      handleMoveStopToDay(
                                        activeDay.dayNumber,
                                        stop.id,
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                    aria-label="Move stop to another day"
                                    className="px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-600"
                                  >
                                    {activeTrip.days.map((d) => (
                                      <option
                                        key={d.dayNumber}
                                        value={d.dayNumber}
                                      >
                                        Day {d.dayNumber}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingStopId === stop.id) {
                                      setEditingStopId(null);
                                    } else {
                                      setEditingStopId(stop.id);
                                      setEditStart(stop.startTime);
                                      setEditEnd(stop.endTime);
                                      setEditCost(String(stop.estimatedCost));
                                      setEditHours(stop.openingHours);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-900"
                                  title="Edit stop timings & cost"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteStop(
                                      activeDay.dayNumber,
                                      stop.id
                                    )
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600"
                                  title="Remove stop"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                {stop.name}
                              </h3>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {stop.description}
                              </p>
                            </div>

                            {/* Inline Edit Drawer */}
                            {editingStopId === stop.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
                              >
                                <div>
                                  <label className="block text-[10px] text-slate-500">
                                    Start (HH:MM)
                                  </label>
                                  <input
                                    type="text"
                                    value={editStart}
                                    onChange={(e) =>
                                      setEditStart(e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500">
                                    End (HH:MM)
                                  </label>
                                  <input
                                    type="text"
                                    value={editEnd}
                                    onChange={(e) => setEditEnd(e.target.value)}
                                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500">
                                    Cost ({getCurrencySymbol(activeTrip.currency)})
                                  </label>
                                  <input
                                    type="number"
                                    value={editCost}
                                    onChange={(e) =>
                                      setEditCost(e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500">
                                    Opening Hours
                                  </label>
                                  <input
                                    type="text"
                                    value={editHours}
                                    onChange={(e) =>
                                      setEditHours(e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveInlineStopEdit(
                                      activeDay.dayNumber,
                                      stop.id
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded hover:bg-teal-800"
                                >
                                  Save & Validate
                                </button>
                              </div>
                            )}

                            {/* Footer: Coordinates, Buddy Votes & Quick Comment */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"
                            >
                              <div className="flex items-center gap-1.5 tabular-nums">
                                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                                <span className="font-mono text-[11px]">
                                  {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                </span>
                                {stop.verifiedPlaceId && (
                                  <span className="text-teal-700 font-medium">
                                    · Verified Place
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const data = await apiFetch(
                                      `/api/trips/${activeTrip.id}/stops/${stop.id}/vote`,
                                      {
                                        method: 'POST',
                                        body: JSON.stringify({
                                          direction: 'up',
                                        }),
                                      }
                                    );
                                    updateTripInState(data.trip);
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-teal-700 tabular-nums"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{(stop.upvotes || []).length}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const data = await apiFetch(
                                      `/api/trips/${activeTrip.id}/stops/${stop.id}/vote`,
                                      {
                                        method: 'POST',
                                        body: JSON.stringify({
                                          direction: 'down',
                                        }),
                                      }
                                    );
                                    updateTripInState(data.trip);
                                  }}
                                  className="flex items-center gap-1 text-slate-600 hover:text-red-600 tabular-nums"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>{(stop.downvotes || []).length}</span>
                                </button>
                              </div>
                            </div>

                            {/* Stop Comments */}
                            {stop.comments && stop.comments.length > 0 && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="space-y-1 pt-1"
                              >
                                {stop.comments.map((c) => (
                                  <div
                                    key={c.id}
                                    className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded"
                                  >
                                    <strong className="text-slate-900">
                                      {c.authorName}:
                                    </strong>{' '}
                                    {c.text}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quick Buddy Comment Input */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 pt-1"
                            >
                              <input
                                type="text"
                                placeholder="Add a comment or tip on this stop..."
                                value={stopCommentText[stop.id] || ''}
                                onChange={(e) =>
                                  setStopCommentText((prev) => ({
                                    ...prev,
                                    [stop.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={async (e) => {
                                  const txt = (
                                    stopCommentText[stop.id] || ''
                                  ).trim();
                                  if (e.key === 'Enter' && txt) {
                                    e.preventDefault();
                                    const data = await apiFetch(
                                      `/api/trips/${activeTrip.id}/stops/${stop.id}/comments`,
                                      {
                                        method: 'POST',
                                        body: JSON.stringify({ text: txt }),
                                      }
                                    );
                                    updateTripInState(data.trip);
                                    setStopCommentText((prev) => ({
                                      ...prev,
                                      [stop.id]: '',
                                    }));
                                  }
                                }}
                                className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white focus:border-teal-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN (5 cols): Interactive Grounded Leaflet Map + Conversational AI Planner (UC4) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
                {/* Interactive Route Map */}
                <RouteMap
                  day={activeDay}
                  centerLat={activeTrip.centerLat}
                  centerLng={activeTrip.centerLng}
                  currency={activeTrip.currency}
                  selectedStopId={selectedStopId}
                  onSelectStop={(id) => setSelectedStopId(id)}
                />

                {/* Conversational AI Planner & Smart Re-Plan Sidebar (UC4) */}
                <div className="border border-slate-200 rounded-xl bg-white flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-teal-700" />
                        Conversational AI Planner (Live Action Mutation)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Ask to swap stops, adjust for rain, or lighten any day.
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Smart Re-Plan Actions */}
                  <div className="p-3 bg-slate-50/60 border-b border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-500">
                      One-Click Smart Re-Plan Actions:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SMART_REPLAN_ACTIONS.map((act) => (
                        <button
                          key={act.label}
                          disabled={isChatMutating}
                          onClick={() => handleSendChatReplan(act.prompt)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-teal-700 hover:text-teal-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Message History */}
                  <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto text-xs">
                    {activeTrip.chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg space-y-1.5 ${
                          msg.sender === 'user'
                            ? 'bg-slate-900 text-white ml-6'
                            : 'bg-slate-50 border border-slate-200 text-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] opacity-75">
                          <span className="font-semibold">
                            {msg.authorName}
                          </span>
                          <span className="tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                        {msg.diffSummary && msg.diffSummary.length > 0 && (
                          <div className="pt-1.5 mt-1.5 border-t border-slate-200 text-[11px] text-teal-800 space-y-0.5">
                            <div className="font-semibold">
                              Applied Schedule Mutations:
                            </div>
                            {msg.diffSummary.map((d, idx) => (
                              <div key={idx}>• {d}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isChatMutating && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 animate-pulse">
                        AI Planner is updating stops and validating opening hours...
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatReplan(chatInput);
                    }}
                    className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatMutating}
                      placeholder='e.g., "Swap the museum on day 1 for a local food market"'
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
                    />
                    <button
                      type="submit"
                      disabled={isChatMutating || !chatInput.trim()}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mutate Plan
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: BUDGET & PACKING (UC5 & UC6) */}
        {activeSection === 'budget_packing' && activeTrip && currentUser && (
          <BudgetPackingView
            trip={activeTrip}
            currentUser={currentUser}
            onAddExpense={async (exp) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/expenses`,
                {
                  method: 'POST',
                  body: JSON.stringify(exp),
                }
              );
              updateTripInState(data.trip);
            }}
            onDeleteExpense={async (expenseId) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/expenses/${expenseId}`,
                {
                  method: 'DELETE',
                }
              );
              updateTripInState(data.trip);
            }}
            onUpdateTotalBudget={async (newBudget) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/budget`,
                {
                  method: 'PUT',
                  body: JSON.stringify({ totalBudget: newBudget }),
                }
              );
              updateTripInState(data.trip);
            }}
            onRegeneratePacking={async () => {
              setIsGeneratingPacking(true);
              try {
                const data = await apiFetch(
                  `/api/trips/${activeTrip.id}/packing/generate`,
                  { method: 'POST' }
                );
                updateTripInState(data.trip);
              } catch (err: any) {
                setStatusBanner({
                  type: 'error',
                  message: err?.message || 'Packing generation failed.',
                });
              } finally {
                setIsGeneratingPacking(false);
              }
            }}
            onUpdatePackingList={async (items: PackingItem[]) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/packing`,
                {
                  method: 'PUT',
                  body: JSON.stringify({ packingList: items }),
                }
              );
              updateTripInState(data.trip);
            }}
            isGeneratingPacking={isGeneratingPacking}
          />
        )}

        {/* VIEW 3: COLLABORATION & GROUP COMPROMISE (UC7 + Creative Feature 3) */}
        {activeSection === 'collaboration' && activeTrip && currentUser && (
          <CollaborationCompromiseView
            trip={activeTrip}
            currentUser={currentUser}
            allUsers={users}
            onJoinByInviteCode={async (inviteCode) => {
              const data = await apiFetch('/api/trips/join', {
                method: 'POST',
                body: JSON.stringify({ inviteCode }),
              });
              updateTripInState(data.trip);
              setActiveTripId(data.trip.id);
            }}
            onVoteStop={async (stopId, direction) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/stops/${stopId}/vote`,
                {
                  method: 'POST',
                  body: JSON.stringify({ direction }),
                }
              );
              updateTripInState(data.trip);
            }}
            onAddComment={async (stopId, text) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/stops/${stopId}/comments`,
                {
                  method: 'POST',
                  body: JSON.stringify({ text }),
                }
              );
              updateTripInState(data.trip);
            }}
            onSubmitCompromiseWish={async (payload) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/compromise/submit`,
                {
                  method: 'POST',
                  body: JSON.stringify(payload),
                }
              );
              updateTripInState(data.trip);
            }}
            onNegotiateCompromise={async () => {
              setIsNegotiating(true);
              try {
                const data = await apiFetch(
                  `/api/trips/${activeTrip.id}/compromise/negotiate`,
                  { method: 'POST' }
                );
                updateTripInState(data.trip);
              } catch (err: any) {
                setStatusBanner({
                  type: 'error',
                  message: err?.message || 'Group compromise negotiation failed.',
                });
              } finally {
                setIsNegotiating(false);
              }
            }}
            isNegotiating={isNegotiating}
          />
        )}

        {/* VIEW 4: TRIP MEMORIES & TRAVEL DIARY (Creative Feature 4) */}
        {activeSection === 'diary' && activeTrip && currentUser && (
          <TravelDiaryView
            trip={activeTrip}
            currentUser={currentUser}
            onAddMemoryNote={async (payload) => {
              const data = await apiFetch(
                `/api/trips/${activeTrip.id}/diary/notes`,
                {
                  method: 'POST',
                  body: JSON.stringify(payload),
                }
              );
              updateTripInState(data.trip);
            }}
            onGenerateDiaryStory={async () => {
              setIsGeneratingDiary(true);
              try {
                const data = await apiFetch(
                  `/api/trips/${activeTrip.id}/diary/generate`,
                  { method: 'POST' }
                );
                updateTripInState(data.trip);
              } catch (err: any) {
                setStatusBanner({
                  type: 'error',
                  message: err?.message || 'Failed to generate Travel Diary.',
                });
              } finally {
                setIsGeneratingDiary(false);
              }
            }}
            isGeneratingDiary={isGeneratingDiary}
          />
        )}

        {/* VIEW 5: ADMIN CONSOLE (UC8) */}
        {activeSection === 'admin' && currentUser && (
          <AdminDashboardView
            currentUser={currentUser}
            users={users}
            aiLogs={aiLogs}
            verifiedPlaces={verifiedPlaces}
            aiStatus={aiStatus}
            onToggleBlockUser={async (userId, isBlocked) => {
              const data = await apiFetch(`/api/admin/users/${userId}/block`, {
                method: 'POST',
                body: JSON.stringify({ isBlocked }),
              });
              setUsers(data.users);
              if (currentUser.id === userId) {
                setCurrentUser(data.user);
              }
            }}
            onAddVerifiedPlace={async (place) => {
              const data = await apiFetch('/api/admin/places', {
                method: 'POST',
                body: JSON.stringify(place),
              });
              setVerifiedPlaces(data.verifiedPlaces);
            }}
            onDeleteVerifiedPlace={async (id) => {
              const data = await apiFetch(`/api/admin/places/${id}`, {
                method: 'DELETE',
              });
              setVerifiedPlaces(data.verifiedPlaces);
            }}
          />
        )}
      </main>

      {/* QUIET FOOTER */}
      <footer className="no-print border-t border-slate-200 bg-white px-6 py-4 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Smart Trip Planner — Grounded AI Itinerary Engine, Schedule Validator & Collaborative Travel Suite
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPrintModal(true)}
              className="hover:text-slate-900"
            >
              Export PDF Dossier
            </button>
            <span>·</span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="hover:text-slate-900"
            >
              Switch Role ({currentUser?.name})
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {showCreateTripModal && (
        <CreateTripModal
          onClose={() => setShowCreateTripModal(false)}
          onCreateTrip={handleCreateTrip}
          isGenerating={isGeneratingTrip}
        />
      )}

      {showPrintModal && activeTrip && (
        <PrintItineraryModal
          trip={activeTrip}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showAuthModal && currentUser && (
        <AuthModal
          users={users}
          currentUser={currentUser}
          onSelectUser={(u) => setCurrentUser(u)}
          onRegisterUser={async (payload) => {
            const data = await apiFetch('/api/auth/register', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === data.user.id);
              return exists ? prev : [...prev, data.user];
            });
            setCurrentUser(data.user);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
