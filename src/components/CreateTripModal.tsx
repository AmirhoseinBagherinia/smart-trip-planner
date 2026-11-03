import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { TravelPersonality } from '../types.ts';
import {
  formatCurrency,
  getCurrencySymbol,
  getSuggestedTripBudget,
} from '../utils/currency.ts';

interface CreateTripModalProps {
  onClose: () => void;
  onCreateTrip: (payload: {
    destination: string;
    startDate: string;
    endDate: string;
    travelersCount: number;
    totalBudget: number;
    currency: string;
    interests: string[];
    personality: TravelPersonality;
    freeTextPrompt: string;
  }) => Promise<void>;
  isGenerating: boolean;
}

const PERSONALITIES: {
  id: TravelPersonality;
  label: string;
  desc: string;
}[] = [
  {
    id: 'Foodie',
    label: 'Foodie',
    desc: '3–4 culinary stops/day: historic bakeries, food halls, regional dinners & boutique foodie hotel',
  },
  {
    id: 'Adventurer',
    label: 'Adventurer',
    desc: 'Energetic pace: panoramic viewpoints, nature trails, active excursions & explorer lodge',
  },
  {
    id: 'Slow Traveler',
    label: 'Slow Traveler',
    desc: 'Max 2–3 stops/day, 2-hour café breaks, botanical gardens & tranquil residential sanctuary',
  },
  {
    id: 'Luxury',
    label: 'Luxury',
    desc: '5-star flagship palace hotel, fine dining reservations, private VIP tours & chauffeur transfers',
  },
  {
    id: 'Backpacker',
    label: 'Backpacker',
    desc: 'Design hostel/eco-lodge, street food stalls, free walking tours, parks & public transit pass',
  },
];

const INTEREST_CHOICES = [
  'Food & Dining',
  'History & Culture',
  'Art & Museums',
  'Nature & Parks',
  'Shopping & Markets',
  'Nightlife & Entertainment',
];

const SAMPLE_PROMPTS = [
  {
    city: 'Dehdasht',
    startDate: '2026-11-12',
    endDate: '2026-11-13',
    budget: 6500000,
    currency: 'IRT',
    personality: 'Foodie' as TravelPersonality,
    text: '2 days in Dehdasht, Iran, Belad Shapur Historical Town, Safavid Caravanserai, Traditional Nomadic Bazaar, Chashmeh Belqeys Garden & Dena foothills nature trail',
  },
  {
    city: 'Dehdasht',
    startDate: '2026-11-12',
    endDate: '2026-11-13',
    budget: 800,
    currency: 'EUR',
    personality: 'Adventurer' as TravelPersonality,
    text: '2 days in Dehdasht, Iran, Belad Shapur Historical Town, Chashmeh Belqeys Garden, Dena foothills trail, and local Boomgardi eco-lodge',
  },
  {
    city: 'Madrid',
    startDate: '2026-11-12',
    endDate: '2026-11-16',
    budget: 1200,
    currency: 'EUR',
    personality: 'Luxury' as TravelPersonality,
    text: '5 days in Madrid, Luxury 5-star Ritz/Four Seasons stay, private Prado & Royal Palace tours, Michelin fine dining',
  },
  {
    city: 'Madrid',
    startDate: '2026-11-12',
    endDate: '2026-11-16',
    budget: 530,
    currency: 'EUR',
    personality: 'Foodie' as TravelPersonality,
    text: '5 days in Madrid, Mercado de San Miguel, historic churros at San Ginés, La Latina tapas, and Prado Museum',
  },
  {
    city: 'Istanbul',
    startDate: '2026-11-12',
    endDate: '2026-11-15',
    budget: 460,
    currency: 'USD',
    personality: 'Foodie' as TravelPersonality,
    text: '4 days in Istanbul, relaxed food and history, Spice Bazaar & Kadikoy markets, medium budget',
  },
  {
    city: 'Paris',
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    budget: 220,
    currency: 'EUR',
    personality: 'Slow Traveler' as TravelPersonality,
    text: '3 days in Paris, unhurried Left Bank art galleries, covered food markets, and Luxembourg gardens',
  },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  onClose,
  onCreateTrip,
  isGenerating,
}) => {
  const [freeTextPrompt, setFreeTextPrompt] = useState(
    '5 days in Madrid, Mercado de San Miguel, historic churros at San Ginés, La Latina tapas, and Prado Museum'
  );
  const [destination, setDestination] = useState('Madrid');
  const [startDate, setStartDate] = useState('2026-11-12');
  const [endDate, setEndDate] = useState('2026-11-16');
  const [travelersCount, setTravelersCount] = useState('2');
  const [totalBudget, setTotalBudget] = useState('530');
  const [currency, setCurrency] = useState('EUR');
  const [personality, setPersonality] = useState<TravelPersonality>('Foodie');
  const [interests, setInterests] = useState<string[]>([
    'Food & Dining',
    'History & Culture',
    'Art & Museums',
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  const daysCount = Math.max(
    1,
    Math.min(
      14,
      Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1 || 4
    )
  );

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    const suggested = getSuggestedTripBudget({
      personality,
      currency: newCurrency,
      daysCount,
      destination,
    });
    setTotalBudget(String(suggested.totalBudget));
  };

  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    const suggested = getSuggestedTripBudget({
      personality,
      currency,
      daysCount,
      destination: newDest,
    });
    setTotalBudget(String(suggested.totalBudget));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!destination.trim() && !freeTextPrompt.trim()) {
      setErrorMsg('Please enter a destination city or describe your trip.');
      return;
    }
    const budgetNum = parseFloat(totalBudget);
    if (Number.isNaN(budgetNum) || budgetNum < 20) {
      setErrorMsg('Please enter a valid total trip budget.');
      return;
    }

    try {
      await onCreateTrip({
        destination: destination.trim() || 'Istanbul',
        startDate,
        endDate,
        travelersCount: Math.max(1, parseInt(travelersCount, 10) || 2),
        totalBudget: budgetNum,
        currency,
        interests: interests.length > 0 ? interests : ['Food & Dining'],
        personality,
        freeTextPrompt: freeTextPrompt.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate trip.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Create New Trip & Generate AI Itinerary
            </h2>
            <p className="text-xs text-slate-500">
              Describe your dream trip in plain words or customize parameters below.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Free Text Prompt (UC2) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-900">
              Describe Your Trip in Plain Words (AI Free-Text Generator)
            </label>
            <textarea
              rows={2}
              value={freeTextPrompt}
              onChange={(e) => setFreeTextPrompt(e.target.value)}
              placeholder="e.g., 2 days in Dehdasht, Iran, Belad Shapur Old Town, Chashmeh Belqeys Garden & Dena foothills"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-500">Quick presets:</span>
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  type="button"
                  key={`${sample.city}-${sample.personality}-${sample.currency}`}
                  onClick={() => {
                    setFreeTextPrompt(sample.text);
                    setDestination(sample.city);
                    setStartDate(sample.startDate);
                    setEndDate(sample.endDate);
                    setTotalBudget(String(sample.budget));
                    setCurrency(sample.currency);
                    setPersonality(sample.personality);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {sample.city} ({sample.personality} · {sample.currency})
                </button>
              ))}
            </div>
          </div>

          {/* Core Trip Fields (UC1) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Destination City
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                placeholder="Dehdasht, Madrid, Istanbul, Paris..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Travelers
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={travelersCount}
                onChange={(e) => setTravelersCount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Budget ({getCurrencySymbol(currency)})
              </label>
              <input
                type="number"
                min={20}
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="EUR">EUR (€ · 0.92x USD)</option>
                <option value="USD">USD ($ · 1.00x base)</option>
                <option value="GBP">GBP (£ · 0.78x USD)</option>
                <option value="IRT">IRT (Tomans · ~90,000/USD)</option>
                <option value="IRR">IRR (Rials · ~900,000/USD)</option>
                <option value="TRY">TRY (₺ · 34.5x USD)</option>
                <option value="JPY">JPY (¥ · 154x USD)</option>
              </select>
            </div>
          </div>

          {/* Travel Personality Mode (Creative Feature 1) */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Select Travel Personality Mode (Scaled to {currency} & {daysCount}-Day Trip)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PERSONALITIES.map((p) => {
                const active = personality === p.id;
                const { dailyBudget, totalBudget: suggestedTotal } =
                  getSuggestedTripBudget({
                    personality: p.id,
                    currency,
                    daysCount,
                    destination,
                  });
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      setPersonality(p.id);
                      setTotalBudget(String(suggestedTotal));
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-teal-50/70 border-teal-700 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {p.label}
                      </span>
                      <span className="text-[11px] font-mono text-teal-800 tabular-nums">
                        ~{formatCurrency(dailyBudget, currency)}/d
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 tabular-nums">
                      Est. {daysCount}d total: ~{formatCurrency(suggestedTotal, currency)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Core Interests
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_CHOICES.map((item) => {
                const selected = interests.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating
                ? 'Validating Coordinates & Generating Plan...'
                : 'Generate Validated Itinerary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
