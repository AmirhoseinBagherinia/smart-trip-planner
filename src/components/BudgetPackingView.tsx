import React, { useState } from 'react';
import {
  CheckSquare,
  CloudRain,
  DollarSign,
  Plus,
  RefreshCw,
  Square,
  Sun,
  Trash2,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  ExpenseCategory,
  PackingCategory,
  PackingItem,
  Trip,
  User,
} from '../types.ts';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.ts';

interface BudgetPackingViewProps {
  trip: Trip;
  currentUser: User;
  onAddExpense: (expense: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    paidBy: string;
    note?: string;
  }) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onUpdateTotalBudget: (newBudget: number) => Promise<void>;
  onOptimizeBudget?: () => Promise<void>;
  isOptimizingBudget?: boolean;
  onRegeneratePacking: () => Promise<void>;
  onUpdatePackingList: (items: PackingItem[]) => Promise<void>;
  isGeneratingPacking: boolean;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Accommodation',
  'Food & Dining',
  'Transport',
  'Activities & Tickets',
  'Shopping & Misc',
];

const PACKING_CATEGORIES: PackingCategory[] = [
  'Clothing',
  'Documents & Money',
  'Toiletries & Health',
  'Electronics',
  'Activity-Specific Gear',
];

export const BudgetPackingView: React.FC<BudgetPackingViewProps> = ({
  trip,
  currentUser,
  onAddExpense,
  onDeleteExpense,
  onUpdateTotalBudget,
  onOptimizeBudget,
  isOptimizingBudget = false,
  onRegeneratePacking,
  onUpdatePackingList,
  isGeneratingPacking,
}) => {
  const currencySymbol = getCurrencySymbol(trip.currency);

  // Expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(trip.startDate);
  const [paidBy, setPaidBy] = useState(currentUser.name);
  const [expenseError, setExpenseError] = useState('');

  // Budget edit state
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(trip.totalBudget));

  // Packing filter & custom item state
  const [selectedPackCat, setSelectedPackCat] = useState<string>('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState<PackingCategory>('Clothing');
  const [newItemQty, setNewItemQty] = useState('1');

  // Calculate Estimated Stop Costs by Category + Accommodation + Daily Transit
  const allStops = trip.days.flatMap((d) => d.stops);
  const totalEstimatedStopsCost = allStops.reduce(
    (sum, s) => sum + Number(s.estimatedCost || 0),
    0
  );
  const accommodationEstimate =
    trip.accommodation?.totalStayCost ?? Math.round(trip.totalBudget * 0.35);
  const transportEstimate =
    trip.dailyTransport?.totalTransportCost ?? Math.round(trip.days.length * 15);
  const totalFullTripEstimate =
    accommodationEstimate + transportEstimate + totalEstimatedStopsCost;

  // Map StopCategory to ExpenseCategory for cohesive comparison
  const estimatedByCategory: Record<ExpenseCategory, number> = {
    Accommodation: accommodationEstimate,
    'Food & Dining': 0,
    Transport: transportEstimate,
    'Activities & Tickets': 0,
    'Shopping & Misc': 0,
  };

  allStops.forEach((s) => {
    const c = Number(s.estimatedCost || 0);
    if (s.category === 'Food & Dining') {
      estimatedByCategory['Food & Dining'] += c;
    } else if (s.category === 'Shopping & Markets') {
      estimatedByCategory['Shopping & Misc'] += c;
    } else if (s.category === 'Transit & Check-in') {
      estimatedByCategory.Transport += c;
    } else {
      estimatedByCategory['Activities & Tickets'] += c;
    }
  });

  const actualByCategory: Record<ExpenseCategory, number> = {
    Accommodation: 0,
    'Food & Dining': 0,
    Transport: 0,
    'Activities & Tickets': 0,
    'Shopping & Misc': 0,
  };

  trip.actualExpenses.forEach((e) => {
    actualByCategory[e.category] =
      (actualByCategory[e.category] || 0) + Number(e.amount || 0);
  });

  const totalActualSpent = trip.actualExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );
  const remainingBudget = trip.totalBudget - totalActualSpent;
  const spentPercentage = Math.round(
    (totalActualSpent / Math.max(1, trip.totalBudget)) * 100
  );

  const isEstimateOverBudget =
    trip.totalBudget > 0 && totalFullTripEstimate > trip.totalBudget;
  const isActualOverBudget =
    trip.totalBudget > 0 && totalActualSpent > trip.totalBudget;
  const isAnyOverBudget = isEstimateOverBudget || isActualOverBudget;

  const estimatedUtilizationPct = Math.round(
    (totalFullTripEstimate / Math.max(1, trip.totalBudget)) * 100
  );
  const highestUtilizationPct = Math.max(
    estimatedUtilizationPct,
    spentPercentage
  );
  const overrunDifference = Math.max(
    0,
    Math.round((totalFullTripEstimate - trip.totalBudget) * 100) / 100
  );
  const overrunPercentage = Math.max(
    1,
    Math.round(
      ((totalFullTripEstimate - trip.totalBudget) /
        Math.max(1, trip.totalBudget)) *
        100
    )
  );

  // Identify top categories pushing cost over the limit when over budget
  const sortedCategoriesByLoad = [...EXPENSE_CATEGORIES].sort((a, b) => {
    const loadA = Math.max(estimatedByCategory[a] || 0, actualByCategory[a] || 0);
    const loadB = Math.max(estimatedByCategory[b] || 0, actualByCategory[b] || 0);
    return loadB - loadA;
  });
  const topOverrunCategories = isAnyOverBudget
    ? sortedCategoriesByLoad.slice(0, 2).filter(
        (cat) =>
          Math.max(estimatedByCategory[cat] || 0, actualByCategory[cat] || 0) >
          trip.totalBudget * 0.2
      )
    : [];

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError('');
    const num = parseFloat(amount);
    if (!title.trim()) {
      setExpenseError('Please enter an expense description.');
      return;
    }
    if (Number.isNaN(num) || num <= 0) {
      setExpenseError('Amount must be greater than zero.');
      return;
    }
    await onAddExpense({
      title: title.trim(),
      category,
      amount: num,
      date: date || trip.startDate,
      paidBy: paidBy || currentUser.name,
    });
    setTitle('');
    setAmount('');
  };

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!Number.isNaN(val) && val >= 50) {
      await onUpdateTotalBudget(val);
      setEditingBudget(false);
    }
  };

  const handleTogglePacked = async (itemId: string) => {
    const next = trip.packingList.map((item) =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    await onUpdatePackingList(next);
  };

  const handleAddCustomPackingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const item: PackingItem = {
      id: `pack-custom-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCat,
      quantity: Math.max(1, parseInt(newItemQty, 10) || 1),
      reason: `Added by ${currentUser.name}`,
      packed: false,
    };
    await onUpdatePackingList([item, ...trip.packingList]);
    setNewItemName('');
    setNewItemQty('1');
  };

  const handleDeletePackingItem = async (itemId: string) => {
    const next = trip.packingList.filter((i) => i.id !== itemId);
    await onUpdatePackingList(next);
  };

  const filteredPacking =
    selectedPackCat === 'All'
      ? trip.packingList
      : trip.packingList.filter((i) => i.category === selectedPackCat);

  const packedCount = trip.packingList.filter((i) => i.packed).length;

  return (
    <div className="space-y-8">
      {/* SECTION 1: BUDGET TRACKER (UC5) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Trip Budget & Expense Ledger ({trip.currency})
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Cohesive {trip.personality} budget profile including recommended accommodation, daily local transit, and scheduled itinerary stops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isEstimateOverBudget && onOptimizeBudget && (
              <button
                onClick={onOptimizeBudget}
                disabled={isOptimizingBudget}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                {isOptimizingBudget
                  ? 'Optimizing Itinerary to Fit Budget...'
                  : '⚡ Optimize Itinerary to Fit Budget'}
              </button>
            )}
            {editingBudget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-32 px-3 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
                <button
                  onClick={handleSaveBudget}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingBudget(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setBudgetInput(String(trip.totalBudget));
                  setEditingBudget(true);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Adjust Budget Cap ({formatCurrency(trip.totalBudget, trip.currency)})
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Budget Verification / Overrun Banner */}
        <div className="pt-5">
          {isEstimateOverBudget ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    ⚠️ Budget Exceeded: Estimated cost of{' '}
                    {formatCurrency(totalFullTripEstimate, trip.currency)} exceeds
                    your budget cap of{' '}
                    {formatCurrency(trip.totalBudget, trip.currency)} by{' '}
                    {formatCurrency(overrunDifference, trip.currency)} (
                    {overrunPercentage}%)
                  </span>
                </div>
                {topOverrunCategories.length > 0 && (
                  <div className="text-xs text-red-800 pl-6">
                    Primary categories pushing cost over limit:{' '}
                    <strong>
                      {topOverrunCategories
                        .map(
                          (c) =>
                            `${c} (${formatCurrency(
                              Math.max(
                                estimatedByCategory[c] || 0,
                                actualByCategory[c] || 0
                              ),
                              trip.currency
                            )})`
                        )
                        .join(' & ')}
                    </strong>
                    .
                  </div>
                )}
              </div>
              {onOptimizeBudget && (
                <button
                  onClick={onOptimizeBudget}
                  disabled={isOptimizingBudget}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isOptimizingBudget
                    ? 'Optimizing Itinerary...'
                    : '[ ⚡ Optimize Itinerary to Fit Budget ]'}
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  <strong>Schedule & Budget Verified:</strong> Estimated total of{' '}
                  {formatCurrency(totalFullTripEstimate, trip.currency)} fits
                  within your {formatCurrency(trip.totalBudget, trip.currency)}{' '}
                  budget cap ({estimatedUtilizationPct}% utilized).
                </span>
              </div>
              <span className="font-mono font-semibold text-teal-800 tabular-nums">
                Surplus:{' '}
                {formatCurrency(
                  Math.max(0, trip.totalBudget - totalFullTripEstimate),
                  trip.currency
                )}
              </span>
            </div>
          )}
        </div>

        {/* Overall Budget Utilization Progress Bar */}
        <div className="pt-4 pb-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Overall Trip Budget Utilization (Estimated vs. Cap)
            </span>
            <span
              className={`font-mono font-bold tabular-nums px-2 py-0.5 rounded ${
                highestUtilizationPct > 100
                  ? 'bg-red-100 text-red-800'
                  : highestUtilizationPct > 85
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-teal-800'
              }`}
            >
              {highestUtilizationPct}% of {formatCurrency(trip.totalBudget, trip.currency)}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                highestUtilizationPct > 100
                  ? 'bg-gradient-to-r from-amber-500 to-red-600'
                  : highestUtilizationPct > 85
                    ? 'bg-amber-500'
                    : 'bg-teal-700'
              }`}
              style={{ width: `${Math.min(100, highestUtilizationPct)}%` }}
            />
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-200">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Total Trip Budget ({trip.currency})
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatCurrency(trip.totalBudget, trip.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {formatCurrency(Math.round(trip.totalBudget / Math.max(1, trip.travelersCount)), trip.currency)} per traveler · {trip.travelersCount} travelers
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isEstimateOverBudget
                ? 'bg-red-50/60 border-red-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="text-xs text-slate-500 font-medium">
              Full Trip Estimate (Stay + Transit + Stops)
            </div>
            <div
              className={`text-2xl font-bold mt-1 tabular-nums ${
                isEstimateOverBudget ? 'text-red-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(totalFullTripEstimate, trip.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Stops: {formatCurrency(totalEstimatedStopsCost, trip.currency)} · Stay: {formatCurrency(accommodationEstimate, trip.currency)} · Transit: {formatCurrency(transportEstimate, trip.currency)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Actual Logged Spending
            </div>
            <div
              className={`text-2xl font-bold mt-1 tabular-nums ${
                isActualOverBudget ? 'text-red-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(totalActualSpent, trip.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {spentPercentage}% of total budget utilized
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Remaining Balance (vs. Estimate)
            </div>
            <div
              className={`text-2xl font-bold mt-1 tabular-nums ${
                trip.totalBudget - totalFullTripEstimate < 0 || remainingBudget < 0
                  ? 'text-red-600'
                  : 'text-teal-700'
              }`}
            >
              {formatCurrency(
                isEstimateOverBudget
                  ? trip.totalBudget - totalFullTripEstimate
                  : remainingBudget,
                trip.currency
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {isEstimateOverBudget
                ? `Exceeds budget by ${formatCurrency(overrunDifference, trip.currency)}`
                : remainingBudget < 0
                  ? 'Over budget threshold'
                  : `${formatCurrency(Math.round((trip.totalBudget - totalFullTripEstimate) / Math.max(1, trip.days.length)), trip.currency)}/day buffer`}
            </div>
          </div>
        </div>

        {/* Recommended Base Accommodation & Daily Transit Plan */}
        {(trip.accommodation || trip.dailyTransport) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 border-b border-slate-200">
            {trip.accommodation && (
              <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-800">
                    Recommended Base Accommodation · {trip.accommodation.style}
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(trip.accommodation.nightlyRate, trip.currency)}/night · Total {formatCurrency(trip.accommodation.totalStayCost, trip.currency)} ({trip.accommodation.nights} nights)
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {trip.accommodation.name} — {trip.accommodation.neighborhood}
                </div>
                <p className="text-xs text-slate-600">
                  {trip.accommodation.bookingNote}
                </p>
              </div>
            )}
            {trip.dailyTransport && (
              <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-800">
                    Daily Local Transit Plan ({trip.personality})
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(trip.dailyTransport.dailyCostPerDay, trip.currency)}/day · Total {formatCurrency(trip.dailyTransport.totalTransportCost, trip.currency)}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {trip.dailyTransport.modeSummary}
                </div>
                <p className="text-xs text-slate-600">
                  {trip.dailyTransport.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {remainingBudget < 0 && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Logged Expenses Alert:</strong> Logged expenses exceed your {formatCurrency(trip.totalBudget, trip.currency)} target by {formatCurrency(Math.abs(remainingBudget), trip.currency)}.
            </span>
          </div>
        )}

        {/* Category Comparison & Log Expense Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Category Breakdown Bars */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Estimated vs. Actual by Category ({trip.currency})
            </h3>
            <div className="space-y-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const est = estimatedByCategory[cat] || 0;
                const act = actualByCategory[cat] || 0;
                const catLoad = Math.max(est, act);
                const shareOfTotalBudgetPct = Math.round(
                  (catLoad / Math.max(1, trip.totalBudget)) * 100
                );
                const isOverrunDriver =
                  topOverrunCategories.includes(cat) ||
                  (act > est && est > 0) ||
                  shareOfTotalBudgetPct > 55;
                const barWidthPct = Math.min(
                  100,
                  Math.max(4, shareOfTotalBudgetPct)
                );

                return (
                  <div
                    key={cat}
                    className={`p-3 rounded-lg border space-y-1.5 ${
                      isOverrunDriver && isAnyOverBudget
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-slate-50/50 border-slate-200/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {cat}
                        </span>
                        {isOverrunDriver && isAnyOverBudget && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded">
                            ⚠️ Pushing Over Limit ({shareOfTotalBudgetPct}% of budget)
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600 tabular-nums">
                        Est:{' '}
                        <strong
                          className={
                            isOverrunDriver && isAnyOverBudget
                              ? 'text-red-700'
                              : 'text-slate-900'
                          }
                        >
                          {formatCurrency(est, trip.currency)}
                        </strong>{' '}
                        · Actual:{' '}
                        <strong className="text-slate-900">
                          {formatCurrency(act, trip.currency)}
                        </strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverrunDriver && isAnyOverBudget
                            ? 'bg-gradient-to-r from-amber-500 to-red-600'
                            : 'bg-teal-700'
                        }`}
                        style={{ width: `${barWidthPct}%` }}
                        title={`${cat}: ${formatCurrency(catLoad, trip.currency)} (${shareOfTotalBudgetPct}% of total budget)`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                      <span>
                        Share of {formatCurrency(trip.totalBudget, trip.currency)} budget cap: {shareOfTotalBudgetPct}%
                      </span>
                      {act > 0 && (
                        <span>
                          Logged: {formatCurrency(act, trip.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Expense & Expense Table */}
          <div className="lg:col-span-6 space-y-5">
            <form
              onSubmit={handleCreateExpense}
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-teal-700" />
                Log Real Expense ({trip.currency})
              </h3>
              {expenseError && (
                <p className="text-xs text-red-600 font-medium">{expenseError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Expense description (e.g., Ferry tickets)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory)
                  }
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder={`Amount (${currencySymbol})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-teal-700"
                />
                <input
                  type="text"
                  placeholder="Paid by"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense Entry
                </button>
              </div>
            </form>

            {/* Expense Ledger Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Expense Item</th>
                    <th className="py-2.5 px-3">Category · Payer</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {trip.actualExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-slate-500"
                      >
                        No real expenses logged yet. Add your first expense above.
                      </td>
                    </tr>
                  ) : (
                    trip.actualExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {exp.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {exp.category} · {exp.paidBy} · {exp.date}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(exp.amount, trip.currency, { showDecimals: true })}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WEATHER FORECAST & SMART PACKING LIST (UC6) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Weather-Grounded Smart Packing Assistant
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Powered by Open-Meteo coordinates forecast ({trip.centerLat.toFixed(2)}°N, {trip.centerLng.toFixed(2)}°E) and Gemini tailored gear recommendations.
            </p>
          </div>
          <button
            onClick={onRegeneratePacking}
            disabled={isGeneratingPacking}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isGeneratingPacking ? 'animate-spin' : ''
              }`}
            />
            {isGeneratingPacking
              ? 'Syncing Weather & Generating...'
              : 'Regenerate Packing List with AI'}
          </button>
        </div>

        {/* Weather Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {trip.weatherForecast.map((dayWeather, i) => (
            <div
              key={dayWeather.date || i}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 tabular-nums">
                  Day {i + 1} · {dayWeather.date}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {dayWeather.conditionSummary}
                </div>
                <div className="text-xs text-slate-500 mt-2 tabular-nums">
                  High {dayWeather.tempMaxC}°C · Low {dayWeather.tempMinC}°C · Rain {dayWeather.precipitationProbability}%
                </div>
              </div>
              {dayWeather.precipitationProbability >= 35 ? (
                <CloudRain className="w-5 h-5 text-teal-700 shrink-0" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Category Filter Bar & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {['All', ...PACKING_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedPackCat(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedPackCat === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-600 font-medium tabular-nums">
            Packed Progress: {packedCount} of {trip.packingList.length} items ({Math.round((packedCount / Math.max(1, trip.packingList.length)) * 100)}%)
          </div>
        </div>

        {/* Add Custom Packing Item */}
        <form
          onSubmit={handleAddCustomPackingItem}
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Add custom item (e.g., Polarizing camera filter)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
          />
          <select
            value={newItemCat}
            onChange={(e) => setNewItemCat(e.target.value as PackingCategory)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          >
            {PACKING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="20"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            className="w-16 px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </form>

        {/* Packing Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPacking.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTogglePacked(item.id)}
              className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                item.packed
                  ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 text-teal-700 shrink-0"
                  aria-label={`Toggle ${item.name}`}
                >
                  {item.packed ? (
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      item.packed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {item.category} · Qty: {item.quantity} · {item.reason}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePackingItem(item.id);
                }}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
