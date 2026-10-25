import React, { useState, useRef, useEffect } from 'react';

export interface PlaceSuggestion {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const PRESET_PLACES: PlaceSuggestion[] = [
  {
    name: 'Sunrise Organic Bakery (Main Kitchen)',
    address: '42 High Meadow Road (Back Service Kitchen #3)',
    lat: 40.7128,
    lng: -74.0060,
  },
  {
    name: 'Campus West Food Counter',
    address: '14 University Way, Student Union Building, Ground Floor',
    lat: 40.7282,
    lng: -73.9942,
  },
  {
    name: 'Green Hostel Canteen',
    address: '88 Riverfront Boulevard, Loading Bay 2',
    lat: 40.7350,
    lng: -74.0100,
  },
  {
    name: 'Hope Community Center Hub',
    address: '128 Hope Avenue, Community Shelter Hub',
    lat: 40.7020,
    lng: -74.0150,
  },
  {
    name: 'Central Plaza Food Court Dock',
    address: '500 Central Avenue, Service Bay B',
    lat: 40.7145,
    lng: -74.0040,
  },
  {
    name: 'Memorial Hospital Staff Canteen',
    address: '220 Healthcare Drive, Staff Entrance',
    lat: 40.7484,
    lng: -73.9857,
  },
];

interface PlacePickerProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  onSelectCoords?: (lat: number, lng: number) => void;
  placeholder?: string;
  required?: boolean;
}

export const PlacePicker: React.FC<PlacePickerProps> = ({
  id = 'pickup-address',
  value,
  onChange,
  onSelectCoords,
  placeholder = 'Street address, back entrance loading bay, floor...',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPlaces = PRESET_PLACES.filter(
    (p) =>
      !value ||
      p.name.toLowerCase().includes(value.toLowerCase()) ||
      p.address.toLowerCase().includes(value.toLowerCase())
  );

  const handleSelect = (place: PlaceSuggestion) => {
    onChange(place.address);
    if (onSelectCoords) {
      onSelectCoords(place.lat, place.lng);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full h-12 px-4 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
        autoComplete="off"
      />
      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-slate-400 pointer-events-none">
        location_on
      </span>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Verified Pickup Places</span>
            <span className="text-[10px] text-emerald-700 font-bold">Auto-pin GPS</span>
          </div>
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 transition-colors flex items-start gap-2.5 border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0 mt-0.5">
                  pin_drop
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {place.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{place.address}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-500 text-center">
              Type your custom address. We'll register it for volunteer navigation.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
