import React, { useState } from 'react';
import {
  Activity,
  Ban,
  CheckCircle2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  AiUsageLog,
  StopCategory,
  User,
  VerifiedPlace,
} from '../types.ts';

interface AdminDashboardViewProps {
  currentUser: User;
  users: User[];
  aiLogs: AiUsageLog[];
  verifiedPlaces: VerifiedPlace[];
  onToggleBlockUser: (userId: string, isBlocked: boolean) => Promise<void>;
  onAddVerifiedPlace: (place: {
    city: string;
    country: string;
    name: string;
    category: StopCategory;
    lat: number;
    lng: number;
    openingHours: string;
    typicalCostUsd: number;
    isIndoor: boolean;
  }) => Promise<void>;
  onDeleteVerifiedPlace: (id: string) => Promise<void>;
}

const STOP_CATEGORIES: StopCategory[] = [
  'Food & Dining',
  'History & Culture',
  'Nature & Parks',
  'Art & Museums',
  'Shopping & Markets',
  'Nightlife & Entertainment',
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  users,
  aiLogs,
  verifiedPlaces,
  onToggleBlockUser,
  onAddVerifiedPlace,
  onDeleteVerifiedPlace,
}) => {
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [placeSearch, setPlaceSearch] = useState('');

  // New Verified Place form
  const [city, setCity] = useState('Istanbul');
  const [country, setCountry] = useState('Turkey');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StopCategory>('History & Culture');
  const [lat, setLat] = useState('41.0112');
  const [lng, setLng] = useState('28.9785');
  const [openingHours, setOpeningHours] = useState('09:00-18:30');
  const [typicalCostUsd, setTypicalCostUsd] = useState('20');
  const [isIndoor, setIsIndoor] = useState(true);
  const [placeError, setPlaceError] = useState('');

  // Telemetry Aggregations
  const totalRequests = aiLogs.length;
  const avgLatencyMs =
    totalRequests > 0
      ? Math.round(
          aiLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / totalRequests
        )
      : 0;
  const totalTokens = aiLogs.reduce(
    (acc, l) => acc + (l.estimatedTokens || 0),
    0
  );
  const totalCostUsd = aiLogs.reduce(
    (acc, l) => acc + (l.estimatedCostUsd || 0),
    0
  );
  const passedCount = aiLogs.filter((l) => l.validationPassed).length;
  const passRatePct =
    totalRequests > 0 ? Math.round((passedCount / totalRequests) * 100) : 100;

  const filteredLogs =
    logStatusFilter === 'all'
      ? aiLogs
      : aiLogs.filter((l) => l.status === logStatusFilter);

  const filteredPlaces = verifiedPlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
      p.city.toLowerCase().includes(placeSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(placeSearch.toLowerCase())
  );

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlaceError('');
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (!name.trim() || !city.trim()) {
      setPlaceError('City and Place Name are required.');
      return;
    }
    if (
      Number.isNaN(numLat) ||
      Number.isNaN(numLng) ||
      Math.abs(numLat) > 90 ||
      Math.abs(numLng) > 180
    ) {
      setPlaceError('Valid WGS84 latitude (-90..90) and longitude (-180..180) required.');
      return;
    }
    await onAddVerifiedPlace({
      city: city.trim(),
      country: country.trim() || 'International',
      name: name.trim(),
      category,
      lat: numLat,
      lng: numLng,
      openingHours: openingHours.trim() || '09:00-18:00',
      typicalCostUsd: Math.max(0, parseFloat(typicalCostUsd) || 15),
      isIndoor,
    });
    setName('');
  };

  return (
    <div className="space-y-8">
      {/* ADMIN HEADER & KPI METRIC STRIP */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Platform Governance, AI Telemetry & Verified Places Console
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Monitor Gemini API latency, token spend, schema validation rates, account moderation, and geographic grounding catalog.
            </p>
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            Signed in as {currentUser.name} ({currentUser.role.toUpperCase()})
          </div>
        </div>

        {/* 4-Column KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">
              Total AI Requests
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalRequests}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Rate limit cap: 15 calls/min/user
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">
              Schema & Schedule Pass Rate
            </div>
            <div className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
              {passRatePct}%
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {passedCount} of {totalRequests} calls passed validation
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">
              Average Response Latency
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {avgLatencyMs} ms
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Includes grounding & validation pass
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">
              Estimated Token Spend
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              ${totalCostUsd.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {totalTokens.toLocaleString()} total tokens processed
            </div>
          </div>
        </div>

        {/* AI REQUEST LOG TABLE */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-700" />
              AI Generation & Mutation Audit Log
            </h3>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {['all', 'success', 'fallback', 'cached', 'blocked', 'rate_limited'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setLogStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                      logStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">AI Feature · Version</th>
                  <th className="py-2.5 px-3">Prompt / Context</th>
                  <th className="py-2.5 px-3 text-right">Latency</th>
                  <th className="py-2.5 px-3 text-right">Tokens · Cost</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap tabular-nums">
                      {log.feature} · {log.promptVersion}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {log.promptSnippet}
                      {log.notes ? ` (${log.notes})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {log.estimatedTokens} · ${log.estimatedCostUsd.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                      {log.status === 'success' && (
                        <span className="text-teal-700">Verified Pass</span>
                      )}
                      {log.status === 'fallback' && (
                        <span className="text-amber-700">Template Fallback</span>
                      )}
                      {log.status === 'cached' && (
                        <span className="text-slate-600">Cache Hit</span>
                      )}
                      {log.status === 'blocked' && (
                        <span className="text-red-600 font-semibold">
                          Blocked Account
                        </span>
                      )}
                      {log.status === 'rate_limited' && (
                        <span className="text-amber-700">Rate Limited</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* USER MODERATION & VERIFIED PLACES MANAGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Accounts & Abuse Moderation */}
        <section className="lg:col-span-5 border border-slate-200 rounded-xl bg-white p-6 space-y-4 h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              User Accounts & AI Access Moderation
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Block or unblock accounts from invoking Gemini AI endpoints. Blocked accounts receive an immediate HTTP 403 restriction notice.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {u.name}
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500 capitalize font-normal">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {u.email} · Status:{' '}
                    <span
                      className={
                        u.isBlocked
                          ? 'text-red-600 font-semibold'
                          : 'text-teal-700 font-medium'
                      }
                    >
                      {u.isBlocked ? 'Restricted / Blocked' : 'Active'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleBlockUser(u.id, !u.isBlocked)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    u.isBlocked
                      ? 'bg-teal-700 text-white border-teal-700 hover:bg-teal-800'
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                  }`}
                >
                  {u.isBlocked ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unblock Account
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      Block Account
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Verified Places Grounding Catalog Manager */}
        <section className="lg:col-span-7 border border-slate-200 rounded-xl bg-white p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              Verified Places Grounding Catalog ({verifiedPlaces.length})
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Manage authoritative WGS84 coordinates and opening hours used to ground AI itineraries and prevent hallucinated venues.
            </p>
          </div>

          {/* Add Verified Place Form */}
          <form
            onSubmit={handleCreatePlace}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-900">
              Add New Verified Place to Grounding Catalog
            </div>
            {placeError && (
              <p className="text-xs text-red-600 font-medium">{placeError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="City (e.g., Istanbul)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Country (e.g., Turkey)"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StopCategory)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                {STOP_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Landmark / Venue Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Opening Hours (09:00-18:00)"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono tabular-nums"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono tabular-nums"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndoor}
                    onChange={(e) => setIsIndoor(e.target.checked)}
                  />
                  Indoor
                </label>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Verify & Add
                </button>
              </div>
            </div>
          </form>

          {/* Search & Table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search verified places by city, name, or category..."
              value={placeSearch}
              onChange={(e) => setPlaceSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="border border-slate-200 rounded-lg max-h-[340px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 sticky top-0">
                  <th className="py-2 px-3">Venue Name · City</th>
                  <th className="py-2 px-3">Coordinates</th>
                  <th className="py-2 px-3">Hours · Est</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredPlaces.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.city}, {p.country} · {p.category} ·{' '}
                        {p.isIndoor ? 'Indoor' : 'Outdoor'}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 tabular-nums">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 tabular-nums">
                      {p.openingHours} · ${p.typicalCostUsd}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => onDeleteVerifiedPlace(p.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove from catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
