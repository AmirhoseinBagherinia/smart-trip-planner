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
} from 'lucide-react';
import {
  ExpenseCategory,
  PackingCategory,
  PackingItem,
  Trip,
  User,
} from '../types.ts';

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
  onRegeneratePacking,
  onUpdatePackingList,
  isGeneratingPacking,
}) => {
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

  // Calculate Estimated Stop Costs by Category
  const allStops = trip.days.flatMap((d) => d.stops);
  const totalEstimatedStopsCost = allStops.reduce(
    (sum, s) => sum + Number(s.estimatedCost || 0),
    0
  );

  // Map StopCategory to ExpenseCategory for comparison
  const estimatedByCategory: Record<ExpenseCategory, number> = {
    Accommodation: Math.round(trip.totalBudget * 0.35), // Baseline accommodation allocation
    'Food & Dining': 0,
    Transport: Math.round(trip.days.length * 12),
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
  const spentPercentage = Math.min(
    100,
    Math.round((totalActualSpent / Math.max(1, trip.totalBudget)) * 100)
  );

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
              Trip Budget & Expense Ledger
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Compare estimated itinerary stop costs against actual logged spending across categories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {editingBudget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-28 px-3 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
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
                Adjust Budget Cap ({trip.currency} {trip.totalBudget})
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-200">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Total Trip Budget
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              ${trip.totalBudget.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              ${Math.round(trip.totalBudget / Math.max(1, trip.travelersCount))} per traveler · {trip.travelersCount} travelers
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Itinerary Stops Estimate
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              ${totalEstimatedStopsCost.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Across {allStops.length} scheduled stops ({trip.days.length} days)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Actual Logged Spending
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              ${totalActualSpent.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {spentPercentage}% of total budget utilized
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">
              Remaining Balance
            </div>
            <div
              className={`text-2xl font-bold mt-1 tabular-nums ${
                remainingBudget < 0 ? 'text-red-600' : 'text-teal-700'
              }`}
            >
              {remainingBudget < 0
                ? `-$${Math.abs(remainingBudget).toLocaleString()}`
                : `$${remainingBudget.toLocaleString()}`}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              {remainingBudget < 0
                ? 'Over budget threshold'
                : `$${Math.round(remainingBudget / Math.max(1, trip.days.length))}/day remaining`}
            </div>
          </div>
        </div>

        {remainingBudget < 0 && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Budget Alert:</strong> Logged expenses exceed your ${trip.totalBudget} target by ${Math.abs(remainingBudget)}. Consider increasing the budget cap or using the AI Planner’s "Reduce Budget by 20%" action.
            </span>
          </div>
        )}

        {/* Category Comparison & Log Expense Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Category Breakdown Bars */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Estimated vs. Actual by Category
            </h3>
            <div className="space-y-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const est = estimatedByCategory[cat] || 0;
                const act = actualByCategory[cat] || 0;
                const maxRef = Math.max(est, act, 100);
                const estPct = Math.min(100, Math.round((est / maxRef) * 100));
                const actPct = Math.min(100, Math.round((act / maxRef) * 100));

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{cat}</span>
                      <span className="text-slate-600 tabular-nums">
                        Est: ${est} · Actual: <strong className="text-slate-900">${act}</strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex flex-col gap-0.5">
                      <div
                        className="h-full bg-teal-700 rounded-full transition-all"
                        style={{ width: `${actPct}%` }}
                        title={`Actual: $${act}`}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      Planned allocation reference: {estPct}% (${est})
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
                Log Real Expense
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
                  placeholder="Amount ($)"
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
                          ${exp.amount.toFixed(2)}
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
