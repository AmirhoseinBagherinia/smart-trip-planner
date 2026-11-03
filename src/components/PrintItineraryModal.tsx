import React from 'react';
import { Printer, X } from 'lucide-react';
import { Trip } from '../types.ts';
import { formatCurrency } from '../utils/currency.ts';

interface PrintItineraryModalProps {
  trip: Trip;
  onClose: () => void;
}

export const PrintItineraryModal: React.FC<PrintItineraryModalProps> = ({
  trip,
  onClose,
}) => {
  const totalEstimatedStops = trip.days
    .flatMap((d) => d.stops)
    .reduce((acc, s) => acc + Number(s.estimatedCost || 0), 0);
  const stayCost = trip.accommodation?.totalStayCost ?? 0;
  const transitCost = trip.dailyTransport?.totalTransportCost ?? 0;
  const totalFullEstimate = totalEstimatedStops + stayCost + transitCost;
  const totalActual = trip.actualExpenses.reduce(
    (acc, e) => acc + Number(e.amount || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Print-Friendly Itinerary & PDF Export Preview
            </h2>
            <p className="text-xs text-slate-500">
              Formatted for clean A4 / Letter PDF export via your browser’s Print to PDF dialog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-8 text-slate-900">
          {/* Document Header */}
          <div className="border-b border-slate-300 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-teal-800">
                Smart Trip Planner — Official Travel Dossier
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {trip.title}
              </h1>
              <p className="text-xs text-slate-600 mt-1 tabular-nums">
                Destination: {trip.destination}, {trip.country} · Dates: {trip.startDate} to {trip.endDate} · Travelers: {trip.travelersCount} · Personality: {trip.personality}
              </p>
            </div>
            <div className="text-xs text-slate-600 tabular-nums sm:text-right">
              <div>Invite Code: {trip.inviteCode}</div>
              <div>
                Budget Cap: {formatCurrency(trip.totalBudget, trip.currency)} (Full Est: {formatCurrency(totalFullEstimate, trip.currency)})
              </div>
            </div>
          </div>

          {/* Accommodation & Daily Transit Summary */}
          {(trip.accommodation || trip.dailyTransport) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs print-break-inside-avoid">
              {trip.accommodation && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                  <div className="font-semibold text-teal-800">
                    Recommended Base Accommodation ({trip.accommodation.style})
                  </div>
                  <div className="font-bold text-slate-900">
                    {trip.accommodation.name} — {trip.accommodation.neighborhood}
                  </div>
                  <div className="text-slate-600 tabular-nums">
                    {formatCurrency(trip.accommodation.nightlyRate, trip.currency)}/night × {trip.accommodation.nights} nights ={' '}
                    <strong>{formatCurrency(trip.accommodation.totalStayCost, trip.currency)}</strong>
                  </div>
                </div>
              )}
              {trip.dailyTransport && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                  <div className="font-semibold text-teal-800">
                    Daily Local Transit Plan
                  </div>
                  <div className="font-bold text-slate-900">
                    {trip.dailyTransport.modeSummary}
                  </div>
                  <div className="text-slate-600 tabular-nums">
                    {formatCurrency(trip.dailyTransport.dailyCostPerDay, trip.currency)}/day ={' '}
                    <strong>{formatCurrency(trip.dailyTransport.totalTransportCost, trip.currency)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day-by-Day Schedule */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              1. Day-by-Day Verified Schedule
            </h2>
            {trip.days.map((day) => (
              <div
                key={day.dayNumber}
                className="space-y-3 print-break-inside-avoid border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="text-sm font-bold text-slate-900">
                    Day {day.dayNumber} ({day.date}): {day.title}
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {day.stops.length} stops
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200/70 space-y-1">
                  <div>
                    <strong>Daily Vibe:</strong> {day.dailyBriefing.vibeSummary}
                  </div>
                  <div>
                    <strong>Local Etiquette:</strong> {day.dailyBriefing.etiquetteTip} ·{' '}
                    <strong>Wear Advice:</strong> {day.dailyBriefing.wearAdvice}
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {day.stops.map((stop, idx) => (
                    <div key={stop.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900 tabular-nums">
                        <span>
                          {idx + 1}. {stop.startTime}–{stop.endTime} · {stop.name}
                        </span>
                        <span>
                          {formatCurrency(stop.estimatedCost, trip.currency)} · Open {stop.openingHours}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{stop.description}</p>
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        Category: {stop.category} · Coordinates: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                        {idx > 0
                          ? ` · Transit from previous: ${stop.distanceFromPrevKm} km (~${stop.travelFromPrevMinutes} min)`
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Budget Summary */}
          <div className="space-y-3 print-break-inside-avoid">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              2. Budget & Expense Summary ({trip.currency})
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs tabular-nums">
              <div className="p-3 rounded border border-slate-200">
                <div className="text-slate-500">Total Trip Budget</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(trip.totalBudget, trip.currency)}
                </div>
              </div>
              <div className="p-3 rounded border border-slate-200">
                <div className="text-slate-500">Full Trip Estimate (Stay + Transit + Stops)</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalFullEstimate, trip.currency)}
                </div>
              </div>
              <div className="p-3 rounded border border-slate-200">
                <div className="text-slate-500">Actual Logged Expenses</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalActual, trip.currency, { showDecimals: true })}
                </div>
              </div>
            </div>
          </div>

          {/* Packing Checklist */}
          <div className="space-y-3 print-break-inside-avoid">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              3. Weather-Grounded Packing Checklist
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {trip.packingList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 py-1 border-b border-slate-100"
                >
                  <span className="font-mono">
                    {item.packed ? '[x]' : '[ ]'}
                  </span>
                  <div>
                    <span className="font-medium text-slate-900">
                      {item.name} (x{item.quantity})
                    </span>
                    <span className="text-slate-500">
                      {' '}
                      — {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
