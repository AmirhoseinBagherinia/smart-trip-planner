import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TripDay, TripStop } from '../types.ts';

interface RouteMapProps {
  day: TripDay;
  centerLat: number;
  centerLng: number;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  day,
  centerLat,
  centerLng,
  selectedStopId,
  onSelectStop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [centerLat || 41.0082, centerLng || 28.9784],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = group;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const visibleStops: TripStop[] = day.mysteryModeEnabled
      ? day.stops.slice(0, Math.max(1, day.revealedStopCount || 1))
      : day.stops;

    const validCoords: [number, number][] = [];

    visibleStops.forEach((stop, index) => {
      if (
        typeof stop.lat !== 'number' ||
        typeof stop.lng !== 'number' ||
        Number.isNaN(stop.lat) ||
        Number.isNaN(stop.lng)
      ) {
        return;
      }

      const pos: [number, number] = [stop.lat, stop.lng];
      validCoords.push(pos);

      const isSelected = selectedStopId === stop.id;
      const bgColor = isSelected ? '#0f766e' : '#0f172a';
      const ringStyle = isSelected
        ? 'box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.3); transform: scale(1.1);'
        : 'box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);';

      const icon = L.divIcon({
        className: 'smart-trip-marker',
        html: `<div style="
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          background: ${bgColor};
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          transition: transform 150ms ease;
          ${ringStyle}
        ">${index + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      });

      const marker = L.marker(pos, { icon });
      const popupHtml = `
        <div style="font-family: 'DM Sans', sans-serif; min-width: 190px; padding: 2px;">
          <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">
            Stop ${index + 1} · ${stop.startTime}–${stop.endTime} · $${stop.estimatedCost}
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${stop.name}
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.35;">
            ${stop.category} · Open ${stop.openingHours}
          </div>
          ${
            stop.verifiedPlaceId
              ? `<div style="font-size: 10px; color: #0f766e; font-weight: 600; margin-top: 4px;">✓ Grounded in Verified Catalog</div>`
              : ''
          }
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });
      marker.addTo(group);

      if (isSelected) {
        marker.openPopup();
      }
    });

    if (validCoords.length > 1) {
      const polyline = L.polyline(validCoords, {
        color: '#0f766e',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      });
      polyline.addTo(group);
    }

    if (selectedStopId) {
      const target = visibleStops.find((s) => s.id === selectedStopId);
      if (target && !Number.isNaN(target.lat) && !Number.isNaN(target.lng)) {
        map.setView([target.lat, target.lng], 15, { animate: true });
        return;
      }
    }

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
    } else {
      map.setView([centerLat || 41.0082, centerLng || 28.9784], 13);
    }
  }, [day, centerLat, centerLng, selectedStopId]);

  const totalDistanceKm = day.stops
    .reduce((acc, s) => acc + (s.distanceFromPrevKm || 0), 0)
    .toFixed(1);
  const totalTransitMin = day.stops.reduce(
    (acc, s) => acc + (s.travelFromPrevMinutes || 0),
    0
  );

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Day {day.dayNumber} Grounded Route Map
          </h3>
          <p className="text-xs text-slate-500 tabular-nums">
            {day.stops.length} stops · {totalDistanceKm} km total route · ~{totalTransitMin} min transit
          </p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          WGS84 Verified Coordinates
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[360px] lg:h-[420px] z-0"
        aria-label={`Interactive route map for Day ${day.dayNumber}`}
      />

      {day.stops.length > 1 && (
        <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 tabular-nums">
          <span className="font-medium text-slate-800">Leg Breakdown:</span>
          {day.stops.slice(1).map((stop, idx) => (
            <span key={stop.id}>
              {idx + 1}→{idx + 2}: {stop.distanceFromPrevKm} km (~{stop.travelFromPrevMinutes}m)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
