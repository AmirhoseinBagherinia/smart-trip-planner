import {
  ScheduleValidationResult,
  TravelPersonality,
  TripDay,
  TripStop,
  ValidationIssue,
  VerifiedPlace,
} from '../types.ts';
import { formatCurrency } from '../utils/currency.ts';

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimates urban transit duration in minutes based on distance in km.
 */
export function estimateTravelMinutes(distanceKm: number): number {
  if (distanceKm <= 0.2) return 5;
  if (distanceKm <= 1.5) {
    // Walking speed ~4.5 km/h
    return Math.max(8, Math.round((distanceKm / 4.5) * 60));
  }
  // Urban transit / metro / taxi ~18 km/h + 8 min boarding buffer
  return Math.min(90, Math.round((distanceKm / 18) * 60 + 8));
}

/**
 * Converts "HH:MM" to minutes since midnight. Returns null if invalid.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
  return hours * 60 + mins;
}

/**
 * Formats minutes since midnight back to "HH:MM".
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Parses opening hours string like "09:00-17:30" into [openMin, closeMin].
 * Returns null if 24 hours or unparseable.
 */
export function parseOpeningHoursRange(
  openingHours: string
): [number, number] | null {
  if (!openingHours) return null;
  const normalized = openingHours.toLowerCase().trim();
  if (
    normalized.includes('24') ||
    normalized.includes('always') ||
    normalized.includes('open')
  ) {
    const dashMatch = openingHours.match(
      /(\d{1,2}:\d{2})\s*[-–—to]+\s*(\d{1,2}:\d{2})/i
    );
    if (!dashMatch) return null;
  }
  const match = openingHours.match(
    /(\d{1,2}:\d{2})\s*[-–—to]+\s*(\d{1,2}:\d{2})/i
  );
  if (!match) return null;
  const openMin = parseTimeToMinutes(match[1]);
  const closeMin = parseTimeToMinutes(match[2]);
  if (openMin === null || closeMin === null) return null;
  return [openMin, closeMin];
}

/**
 * Grounds stops against the Verified Places catalog and recalculates distances/travel times.
 * Enforces strict geographic coordinate uniqueness so no two stops ever share identical coordinates
 * or bounce back and forth between two pins.
 */
export function groundAndEnrichDays(
  days: TripDay[],
  verifiedPlaces: VerifiedPlace[],
  fallbackCenterLat = 41.0082,
  fallbackCenterLng = 28.9784
): TripDay[] {
  const usedVerifiedPlaceIds = new Set<string>();
  const globalPlacedCoords: Array<{ lat: number; lng: number }> = [];

  // Well-distributed radial compass offsets (~350m to ~950m) if two stops ever collide
  const DISTINCT_COMPASS_OFFSETS: Array<[number, number]> = [
    [0.0034, 0.0031],
    [-0.0038, 0.0036],
    [0.0042, -0.0035],
    [-0.0036, -0.0041],
    [0.0056, 0.0018],
    [-0.0052, 0.0024],
    [0.0025, 0.0058],
    [-0.0029, -0.0055],
  ];

  return days.map((day, dayIdx) => {
    const dayPlacedCoords: Array<{ lat: number; lng: number }> = [];

    const enrichedStops: TripStop[] = day.stops.map((stop, idx) => {
      const normalizedStopName = stop.name.toLowerCase().trim();
      const matchedPlace = verifiedPlaces.find((vp) => {
        if (usedVerifiedPlaceIds.has(vp.id)) return false;
        if (stop.verifiedPlaceId && stop.verifiedPlaceId === vp.id) {
          return true;
        }
        const vpName = vp.name.toLowerCase().trim();
        return (
          normalizedStopName.includes(vpName) ||
          vpName.includes(normalizedStopName)
        );
      });

      if (matchedPlace) {
        usedVerifiedPlaceIds.add(matchedPlace.id);
      }

      let lat = Number(stop.lat);
      let lng = Number(stop.lng);

      const hasValidStopCoords =
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180 &&
        !(lat === 0 && lng === 0);

      if (!hasValidStopCoords && matchedPlace) {
        lat = matchedPlace.lat;
        lng = matchedPlace.lng;
      } else if (!hasValidStopCoords) {
        const [dLat, dLng] =
          DISTINCT_COMPASS_OFFSETS[
            (dayIdx * 4 + idx) % DISTINCT_COMPASS_OFFSETS.length
          ];
        lat = Number((fallbackCenterLat + dLat).toFixed(5));
        lng = Number((fallbackCenterLng + dLng).toFixed(5));
      }

      // Strict Coordinate Uniqueness Guard: ensure this stop does not share coordinates
      // with any other stop on the same day or across the itinerary
      let collisionCheckAttempts = 0;
      while (
        collisionCheckAttempts < 8 &&
        (dayPlacedCoords.some(
          (c) =>
            Math.abs(c.lat - lat) < 0.0008 && Math.abs(c.lng - lng) < 0.0008
        ) ||
          globalPlacedCoords.some(
            (c) =>
              Math.abs(c.lat - lat) < 0.0004 && Math.abs(c.lng - lng) < 0.0004
          ))
      ) {
        const [offLat, offLng] =
          DISTINCT_COMPASS_OFFSETS[
            (dayIdx * 5 + idx + collisionCheckAttempts) %
              DISTINCT_COMPASS_OFFSETS.length
          ];
        const scale = 1 + collisionCheckAttempts * 0.45;
        lat = Number((lat + offLat * scale).toFixed(5));
        lng = Number((lng + offLng * scale).toFixed(5));
        collisionCheckAttempts++;
      }

      dayPlacedCoords.push({ lat, lng });
      globalPlacedCoords.push({ lat, lng });

      const startMin = parseTimeToMinutes(stop.startTime) ?? 9 * 60 + idx * 150;
      const endMin =
        parseTimeToMinutes(stop.endTime) ??
        startMin + (stop.durationMinutes || 90);
      const durationMinutes = Math.max(15, endMin - startMin);

      return {
        ...stop,
        lat,
        lng,
        openingHours:
          stop.openingHours || matchedPlace?.openingHours || '09:00-20:00',
        verifiedPlaceId: matchedPlace?.id ?? stop.verifiedPlaceId,
        durationMinutes,
        upvotes: Array.isArray(stop.upvotes) ? stop.upvotes : [],
        downvotes: Array.isArray(stop.downvotes) ? stop.downvotes : [],
        comments: Array.isArray(stop.comments) ? stop.comments : [],
      };
    });

    // Calculate distance and travel time from previous stop
    for (let i = 0; i < enrichedStops.length; i++) {
      if (i === 0) {
        enrichedStops[i].distanceFromPrevKm = 0;
        enrichedStops[i].travelFromPrevMinutes = 0;
      } else {
        const prev = enrichedStops[i - 1];
        const curr = enrichedStops[i];
        const distKm = calculateDistanceKm(
          prev.lat,
          prev.lng,
          curr.lat,
          curr.lng
        );
        enrichedStops[i].distanceFromPrevKm = distKm;
        enrichedStops[i].travelFromPrevMinutes = estimateTravelMinutes(distKm);
      }
    }

    return {
      ...day,
      stops: enrichedStops,
    };
  });
}

/**
 * Automatically adjusts sequential stop start/end times in a day to eliminate overlaps
 * and respect travel gaps after reordering or adding stops.
 */
export function autoFixScheduleTimings(days: TripDay[]): TripDay[] {
  return days.map((day) => {
    let cursorMin = 9 * 60 + 30; // Start day at 09:30 by default
    const fixedStops = day.stops.map((stop, idx) => {
      if (idx === 0) {
        const parsedFirst = parseTimeToMinutes(stop.startTime);
        if (parsedFirst !== null && parsedFirst >= 7 * 60 && parsedFirst <= 12 * 60) {
          cursorMin = parsedFirst;
        }
      } else {
        const travelGap = Math.max(15, stop.travelFromPrevMinutes || 20);
        cursorMin += travelGap;
      }

      // Check if opening hours require waiting until open
      const openRange = parseOpeningHoursRange(stop.openingHours);
      if (openRange && cursorMin < openRange[0]) {
        cursorMin = openRange[0];
      }

      const duration = Math.max(30, stop.durationMinutes || 90);
      const startTime = formatMinutesToTime(cursorMin);
      const endMin = Math.min(23 * 60 + 30, cursorMin + duration);
      const endTime = formatMinutesToTime(endMin);
      cursorMin = endMin;

      return {
        ...stop,
        startTime,
        endTime,
        durationMinutes: endMin - (parseTimeToMinutes(startTime) ?? cursorMin),
      };
    });

    return {
      ...day,
      stops: fixedStops,
    };
  });
}

/**
 * Runs full Schedule & Quality Guard validation across all days, stops, coordinates,
 * opening hours, transit gaps, personality pacing, and total budget.
 */
export function validateTripSchedule(params: {
  days: TripDay[];
  totalBudget: number;
  currency?: string;
  accommodationCost?: number;
  transportCost?: number;
  personality: TravelPersonality;
  verifiedPlaces: VerifiedPlace[];
}): ScheduleValidationResult {
  const {
    days,
    totalBudget,
    currency = 'USD',
    accommodationCost = 0,
    transportCost = 0,
    personality,
    verifiedPlaces,
  } = params;
  const issues: ValidationIssue[] = [];
  let totalEstimatedCost = 0;
  let totalStops = 0;
  let verifiedStopsCount = 0;

  for (const day of days) {
    // Check personality pacing
    if (personality === 'Slow Traveler' && day.stops.length > 3) {
      issues.push({
        id: `pacing-day-${day.dayNumber}`,
        severity: 'warning',
        type: 'pacing_warning',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} has ${day.stops.length} stops, which exceeds the Slow Traveler pacing target of at most 3 stops per day.`,
        suggestion:
          'Remove 1 stop or use the AI Planner to make this day more relaxed.',
      });
    }

    for (let i = 0; i < day.stops.length; i++) {
      const stop = day.stops[i];
      totalStops += 1;
      totalEstimatedCost += Number(stop.estimatedCost || 0);

      // Check if grounded in verified places
      const isVerified =
        Boolean(stop.verifiedPlaceId) ||
        verifiedPlaces.some(
          (vp) =>
            calculateDistanceKm(stop.lat, stop.lng, vp.lat, vp.lng) <= 0.5 ||
            stop.name.toLowerCase().includes(vp.name.toLowerCase())
        );
      if (isVerified) {
        verifiedStopsCount += 1;
      }

      // 1. Validate geographic coordinates
      if (
        typeof stop.lat !== 'number' ||
        typeof stop.lng !== 'number' ||
        Number.isNaN(stop.lat) ||
        Number.isNaN(stop.lng) ||
        Math.abs(stop.lat) > 90 ||
        Math.abs(stop.lng) > 180 ||
        (stop.lat === 0 && stop.lng === 0)
      ) {
        issues.push({
          id: `coord-${stop.id}`,
          severity: 'error',
          type: 'invalid_coordinates',
          dayNumber: day.dayNumber,
          stopId: stop.id,
          stopName: stop.name,
          message: `"${stop.name}" on Day ${day.dayNumber} has invalid geographic coordinates.`,
          suggestion: 'Select a verified place or update coordinates.',
        });
      }

      const startMin = parseTimeToMinutes(stop.startTime);
      const endMin = parseTimeToMinutes(stop.endTime);

      if (startMin === null || endMin === null || endMin <= startMin) {
        issues.push({
          id: `time-invalid-${stop.id}`,
          severity: 'error',
          type: 'time_overlap',
          dayNumber: day.dayNumber,
          stopId: stop.id,
          stopName: stop.name,
          message: `"${stop.name}" on Day ${day.dayNumber} has invalid start/end times (${stop.startTime}–${stop.endTime}).`,
          suggestion: 'Click "Auto-Fix Timings" to recalculate schedule order.',
        });
        continue;
      }

      // 2. Check opening hours compliance
      const openRange = parseOpeningHoursRange(stop.openingHours);
      if (openRange) {
        const [openMin, closeMin] = openRange;
        if (closeMin > openMin) {
          if (startMin < openMin || endMin > closeMin) {
            issues.push({
              id: `open-hours-${stop.id}`,
              severity: 'warning',
              type: 'opening_hours',
              dayNumber: day.dayNumber,
              stopId: stop.id,
              stopName: stop.name,
              message: `"${stop.name}" is scheduled for ${stop.startTime}–${stop.endTime}, outside its opening hours (${stop.openingHours}).`,
              suggestion: `Reschedule between ${stop.openingHours} or swap with an evening stop.`,
            });
          }
        }
      }

      // 3. Check overlap and transit gap with previous stop
      if (i > 0) {
        const prev = day.stops[i - 1];
        const prevEndMin = parseTimeToMinutes(prev.endTime);
        if (prevEndMin !== null) {
          const gapMinutes = startMin - prevEndMin;
          const requiredTransit = stop.travelFromPrevMinutes || 15;
          if (gapMinutes < 0) {
            issues.push({
              id: `overlap-${stop.id}`,
              severity: 'error',
              type: 'time_overlap',
              dayNumber: day.dayNumber,
              stopId: stop.id,
              stopName: stop.name,
              message: `"${stop.name}" (${stop.startTime}) overlaps with "${prev.name}" (ends ${prev.endTime}) on Day ${day.dayNumber}.`,
              suggestion:
                'Click "Auto-Fix Timings" to shift subsequent stops automatically.',
            });
          } else if (gapMinutes < requiredTransit) {
            issues.push({
              id: `transit-${stop.id}`,
              severity: 'warning',
              type: 'tight_transit',
              dayNumber: day.dayNumber,
              stopId: stop.id,
              stopName: stop.name,
              message: `Only ${gapMinutes} min scheduled between "${prev.name}" and "${stop.name}", but transit takes ~${requiredTransit} min (${stop.distanceFromPrevKm} km).`,
              suggestion:
                'Click "Auto-Fix Timings" to insert sufficient transit buffer.',
            });
          }
        }
      }
    }
  }

  const totalTripEstimatedCost =
    Math.round((totalEstimatedCost + accommodationCost + transportCost) * 100) /
    100;

  // 4. Check budget overrun against total trip budget
  if (totalBudget > 0 && totalTripEstimatedCost > totalBudget) {
    const overAmount =
      Math.round((totalTripEstimatedCost - totalBudget) * 100) / 100;
    const overPct = Math.max(
      1,
      Math.round(((totalTripEstimatedCost - totalBudget) / totalBudget) * 100)
    );
    issues.push({
      id: 'budget-overrun-total',
      severity: 'warning',
      type: 'budget_overrun',
      message: `Estimated cost of ${formatCurrency(totalTripEstimatedCost, currency)} exceeds your budget cap of ${formatCurrency(totalBudget, currency)} by ${formatCurrency(overAmount, currency)} (${overPct}%).`,
      suggestion:
        'Click "⚡ Optimize Itinerary to Fit Budget" to swap high-cost stops and lodging for authentic budget-friendly local alternatives.',
    });
  }

  return {
    isValid: !issues.some((i) => i.severity === 'error'),
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    totalTripEstimatedCost,
    totalStops,
    verifiedStopsCount,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
