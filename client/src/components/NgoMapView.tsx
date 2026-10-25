import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';

interface MapBatchItem {
  id: string;
  donor: string;
  category: string;
  quantity: number;
  locationTitle: string;
  minutesLeft: number;
  color: 'red' | 'amber' | 'green';
  lat: number;
  lng: number;
  distanceKm?: number | null;
  contact: string;
}

interface NgoMapViewProps {
  batches: MapBatchItem[];
  onClaim: (id: string, location: string, contact: string, expiryStr: string) => void;
}

export const NgoMapView: React.FC<NgoMapViewProps> = ({ batches, onClaim }) => {
  const { currentLocation, districts, setCurrentLocation } = useLocation();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    batches.length > 0 ? batches[0].id : null
  );

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Map coordinates normalizer (bounds for demo city approx 40.70 to 40.75 N, -74.02 to -73.98 W)
  const minLat = 40.695;
  const maxLat = 40.755;
  const minLng = -74.025;
  const maxLng = -73.980;

  const getPercentPos = (lat: number, lng: number) => {
    const x = Math.max(5, Math.min(95, ((lng - minLng) / (maxLng - minLng)) * 100));
    // Invert y because latitude increases upward
    const y = Math.max(8, Math.min(92, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
    return { x, y };
  };

  const userPos = getPercentPos(currentLocation.lat, currentLocation.lng);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      {/* Map Viewport Area */}
      <div className="relative flex-1 min-h-[460px] bg-slate-100 overflow-hidden select-none">
        {/* Stylized Map Grid Canvas */}
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#city-grid)" />
          {/* Main City River / Transit Corridor */}
          <path
            d="M 120 0 Q 220 180 340 280 T 600 500"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="32"
            strokeOpacity="0.4"
          />
          <path
            d="M 0 350 Q 250 320 500 420 T 900 400"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="10"
            strokeDasharray="6 4"
          />
        </svg>

        {/* District Zones Labels on Map */}
        <div className="absolute top-6 left-8 pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            North Market Sector
          </span>
        </div>
        <div className="absolute bottom-6 right-8 pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            South Bay & Docks
          </span>
        </div>
        <div className="absolute top-8 right-12 pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            University Quarter
          </span>
        </div>

        {/* User Current Rescue Base Radar Pin */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></span>
            <span className="relative w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <span className="material-symbols-outlined text-[15px]">home_pin</span>
            </span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 whitespace-nowrap bg-emerald-950 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md pointer-events-none">
            Your Base
          </div>
        </div>

        {/* Food Batch Pins on Map */}
        {batches.map((batch) => {
          const isSelected = selectedBatchId === batch.id;
          const pos = getPercentPos(batch.lat, batch.lng);
          const isUrgent = batch.color === 'red';
          const isAmber = batch.color === 'amber';

          const pinBg = isUrgent
            ? 'bg-rose-600 text-white'
            : isAmber
            ? 'bg-amber-500 text-white'
            : 'bg-emerald-700 text-white';

          return (
            <button
              key={batch.id}
              type="button"
              onClick={() => setSelectedBatchId(batch.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-transform cursor-pointer hover:scale-125 focus:outline-none ${
                isSelected ? 'scale-125 z-40' : ''
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={`${batch.donor} - ${batch.quantity} portions (${batch.distanceKm ?? 1.2} km away)`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white ${pinBg}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {batch.category.toLowerCase().includes('bakery')
                    ? 'bakery_dining'
                    : batch.category.toLowerCase().includes('fruit')
                    ? 'nutrition'
                    : 'soup_kitchen'}
                </span>
                {isUrgent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </div>
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm whitespace-nowrap border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 scale-105'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                {batch.quantity} meals • {batch.distanceKm ?? 1.2} km
              </div>
            </button>
          );
        })}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 rounded-xl shadow-md text-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>&lt;30m Urgent</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>&lt;2h Warning</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
            <span>&gt;2h Available</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 border-l border-slate-200 pl-3">
            <span className="w-3 h-3 rounded-full bg-emerald-800 border border-white"></span>
            <span>Your Rescue Base</span>
          </div>
        </div>
      </div>

      {/* Selected Batch Details Panel */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 p-5 flex flex-col justify-between bg-white">
        {selectedBatch ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  selectedBatch.color === 'red'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedBatch.color === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedBatch.minutesLeft < 30
                  ? `Urgent: ${selectedBatch.minutesLeft}m left`
                  : `Expires in ${Math.floor(selectedBatch.minutesLeft / 60)}h ${
                      selectedBatch.minutesLeft % 60
                    }m`}
              </span>
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">near_me</span>
                {selectedBatch.distanceKm != null ? `${selectedBatch.distanceKm} km away` : '1.2 km away'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {selectedBatch.donor}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              {selectedBatch.category}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-800 shrink-0 mt-0.5">
                  room_service
                </span>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{selectedBatch.quantity}</span>
                  <span className="text-slate-600 ml-1">portions ready to serve</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-800 shrink-0 mt-0.5">
                  pin_drop
                </span>
                <span className="text-slate-700 font-medium">
                  {selectedBatch.locationTitle}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-800 shrink-0 mt-0.5">
                  call
                </span>
                <span className="text-slate-700">{selectedBatch.contact}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onClaim(
                  selectedBatch.id,
                  selectedBatch.locationTitle,
                  selectedBatch.contact,
                  `${selectedBatch.minutesLeft}m`
                )
              }
              className="w-full mt-4 bg-emerald-800 hover:bg-emerald-900 text-white py-3 rounded-full text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                assignment_turned_in
              </span>
              Claim this batch
            </button>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            Select a pin on the map to inspect batch details and claim.
          </div>
        )}

        {/* Change Base Shortcut */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Active Base:</span>
          <select
            value={currentLocation.id}
            onChange={(e) => {
              const found = districts.find((d) => d.id === e.target.value);
              if (found) setCurrentLocation(found);
            }}
            className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md border border-slate-200 cursor-pointer outline-none"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
