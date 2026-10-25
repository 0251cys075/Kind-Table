import React, { useState, useEffect } from 'react';
import type { FoodCategory, FoodBatch, BatchStatus } from '../types';
import { useLiveAlerts } from '../context/LiveAlertsContext';
import { useAuth } from '../context/AuthContext';
import { PlacePicker } from '../components/PlacePicker';

interface DonorPageProps {
  onNavigateToNGO: (batchId?: string) => void;
}

interface CategoryOption {
  id: string;
  name: FoodCategory;
  label: string;
  icon: string;
  subtext: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'cooked', name: 'Cooked meal', label: 'Cooked Meal', icon: 'soup_kitchen', subtext: 'Stew, rice & curries' },
  { id: 'bakery', name: 'Bakery', label: 'Fresh Bakery', icon: 'bakery_dining', subtext: 'Bread, rolls & buns' },
  { id: 'produce', name: 'Fruit and vegetables', label: 'Fruit & Veg', icon: 'nutrition', subtext: 'Apples, crates & greens' },
  { id: 'packaged', name: 'Packaged food', label: 'Packaged Goods', icon: 'inventory_2', subtext: 'Cans, boxed & pantry' },
  { id: 'dairy', name: 'Dairy', label: 'Chilled Dairy', icon: 'egg', subtext: 'Milk, cheeses & curds' },
];

const HELP_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  'help-donor': {
    title: 'Organisation Name',
    body: 'This name is shown directly to NGO drivers so they know whose front desk or loading dock to ask for upon arrival.',
  },
  'help-category': {
    title: 'Food Category Guide',
    body: 'Different categories trigger specific courier vehicles. For example, cooked meals notify volunteers equipped with heated insulation crates.',
  },
  'help-portions': {
    title: 'Portion Counting',
    body: 'Estimate how many standard single-meal servings this batch contains. One portion roughly equals one boxed plate or 350 grams.',
  },
  'help-freshness': {
    title: 'Ambient Freshness Window',
    body: 'Select how long the food can sit safely at room temperature before it must be chilled or consumed. Couriers will prioritize listings closest to expiry.',
  },
  'help-history': {
    title: 'Understanding Status Chips',
    body: 'Available means your food is still broadcasting to nearby shelters. Claimed means an NGO is en route with an estimated time of arrival.',
  },
};

export const DonorPage: React.FC<DonorPageProps> = ({ onNavigateToNGO }) => {
  const { batches, refreshData, setTrackBatchId } = useLiveAlerts();
  const { user } = useAuth();

  // Form State
  const [donorName, setDonorName] = useState('Sunrise Organic Bakery');
  const [selectedCatId, setSelectedCatId] = useState('bakery');
  const [portions, setPortions] = useState('45');
  const [location, setLocation] = useState('42 High Meadow Road (Back Service Kitchen #3)');
  const [batchCoords, setBatchCoords] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [selectedHours, setSelectedHours] = useState(4);
  const [customHours, setCustomHours] = useState('');

  // If user is logged in, prepopulate their registered donor info
  useEffect(() => {
    if (user) {
      if (user.name) setDonorName(user.name);
      if (user.defaultLocation) setLocation(user.defaultLocation);
      if (user.latitude && user.longitude) {
        setBatchCoords({ lat: user.latitude, lng: user.longitude });
      }
    }
  }, [user]);

  // Dietary Tags
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [isHalal, setIsHalal] = useState(false);
  const [isBoxesProvided, setIsBoxesProvided] = useState(true);

  // Validation Errors
  const [errors, setErrors] = useState<{ donor?: string; portions?: string; location?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Tour
  const [showTour, setShowTour] = useState(true);
  const [tourIndex, setTourIndex] = useState(1);
  const [confirmationBatch, setConfirmationBatch] = useState<FoodBatch | null>(null);
  const [helpModalKey, setHelpModalKey] = useState<string | null>(null);

  // Table filter
  const [tableFilter, setTableFilter] = useState<'all' | BatchStatus>('all');

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCatId) || CATEGORIES[1];

  const handlePortionAdjust = (delta: number) => {
    const val = Math.max(1, (parseInt(portions, 10) || 0) + delta);
    setPortions(String(val));
  };

  const handleSelectHour = (h: number) => {
    setSelectedHours(h);
    setCustomHours('');
  };

  const handleCustomHourInput = (val: string) => {
    setCustomHours(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) {
      setSelectedHours(n);
    }
  };

  const autoFillLocation = () => {
    setLocation('Sunrise Bakery (Rear Loading Bay 2), 42 High Meadow Road');
  };

  // Tour steps
  const tourSteps = [
    {
      step: 1,
      targetId: 'field-category',
      text: 'Step 1: Click the food category card that best fits your surplus food.',
    },
    {
      step: 2,
      targetId: 'field-portions',
      text: 'Step 2: Estimate how many full meals or boxes this batch supplies.',
    },
    {
      step: 3,
      targetId: 'field-freshness',
      text: 'Step 3: Choose freshness hours and tap the big green button to dispatch.',
    },
  ];

  const nextTourStep = () => {
    if (tourIndex < 3) {
      const nextIdx = tourIndex + 1;
      setTourIndex(nextIdx);
      const targetEl = document.getElementById(tourSteps[nextIdx - 1].targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setShowTour(false);
    }
  };

  const prevTourStep = () => {
    if (tourIndex > 1) {
      const prevIdx = tourIndex - 1;
      setTourIndex(prevIdx);
      const targetEl = document.getElementById(tourSteps[prevIdx - 1].targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { donor?: string; portions?: string; location?: string } = {};

    if (!donorName.trim()) {
      newErrors.donor = 'Please share your business or canteen name so volunteers know who to ask for.';
    }
    const portionNum = parseInt(portions, 10);
    if (!portionNum || portionNum < 1) {
      newErrors.portions = 'Please enter at least 1 portion.';
    }
    if (!location.trim()) {
      newErrors.location = 'Please provide a pickup address so volunteers know where to navigate.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const tags: string[] = [];
      if (isVegetarian) tags.push('Vegetarian');
      if (isHalal) tags.push('Halal certified');
      if (isBoxesProvided) tags.push('Boxes provided');

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor: donorName.trim(),
          category: activeCategory.name,
          quantity: portionNum,
          location: location.trim(),
          expiresInMinutes: selectedHours * 60,
          dietaryTags: tags.join(', '),
          latitude: batchCoords.lat,
          longitude: batchCoords.lng,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to list batch');
      }

      setConfirmationBatch(data.batch);
      await refreshData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepareAnotherDonation = () => {
    setConfirmationBatch(null);
    setPortions('25');
    setLocation('42 High Meadow Road (Back Service Kitchen #3)');
    setSelectedCatId('cooked');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const relistExpired = () => {
    setSelectedCatId('produce');
    setPortions('20');
    setSelectedHours(4);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Filtered donations
  const filteredDonations = batches.filter((b) => {
    if (tableFilter === 'all') return true;
    return b.status === tableFilter;
  });

  const availableCount = batches.filter((b) => b.status === 'Available').length;
  const claimedCount = batches.filter((b) => b.status === 'Claimed').length;
  const expiredCount = batches.filter((b) => b.status === 'Expired').length;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col w-full pb-16 font-sans">
      {/* Interactive Tour Banner (Readable Emerald Banner) */}
      {showTour && (
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quick Guided Tour</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Step {tourIndex} of 3
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-emerald-950 mt-0.5">
                  {tourSteps[tourIndex - 1].text}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              {tourIndex > 1 && (
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={prevTourStep}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 shadow-sm transition-all cursor-pointer"
                onClick={nextTourStep}
              >
                {tourIndex === 3 ? 'Finish tour' : 'Next hint'}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer"
                onClick={() => setShowTour(false)}
                title="Dismiss quick tour"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Intro & Impact Stats Row */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full mb-3 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-amber-700">volunteer_activism</span>
              <span>Rapid Dispatch Portal • Verified Shelters Connected</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Share wholesome food in minutes.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mt-2 leading-relaxed">
              List leftover batches from your bakery, canteen, or event. Nearby registered shelters and volunteers get pinged immediately.
            </p>
          </div>

          {/* Mini Quick Stats Chip */}
          <div className="flex items-center gap-6 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-500">Average NGO Claim</span>
              <span className="text-2xl font-extrabold text-slate-900">18 mins</span>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-500">Active Couriers</span>
              <span className="text-2xl font-extrabold text-amber-700">24 nearby</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interaction Area: Form + Live Preview Card */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <form
              id="donation-form"
              onSubmit={handleFormSubmit}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6 relative"
            >
              {/* Field 1: Name / Organisation */}
              <div className="flex flex-col gap-1.5" id="field-donor">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1" htmlFor="donor-name">
                    Your name or organisation
                    <span className="text-amber-700">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-emerald-800 transition-colors flex items-center cursor-pointer"
                    onClick={() => setHelpModalKey('help-donor')}
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                </div>
                <input
                  id="donor-name"
                  type="text"
                  required
                  readOnly={!!user}
                  value={user ? (user.organization ? `${user.name} (${user.organization})` : user.name) : donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g., Sunrise Organic Bakery & Pantry"
                  className={`w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base ${
                    user ? 'bg-slate-100 cursor-default' : ''
                  }`}
                />
                <p className="text-xs text-slate-500">e.g., Green Hostel Canteen or Sunrise Bakery</p>
                {errors.donor && (
                  <p className="text-xs font-semibold text-rose-600">{errors.donor}</p>
                )}
              </div>

              {/* Field 2: Food Category (5 Icon Cards) */}
              <div className="flex flex-col gap-2" id="field-category">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1">
                    Food category
                    <span className="text-amber-700">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-emerald-800 transition-colors flex items-center cursor-pointer"
                    onClick={() => setHelpModalKey('help-category')}
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 -mt-1">Tap one card to assign handling and packaging instructions.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`group flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-all cursor-pointer relative border ${
                          cat.id === 'dairy' ? 'col-span-2 sm:col-span-1' : ''
                        } ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-md border-transparent'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 group-hover:bg-emerald-800 group-hover:text-white text-slate-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[26px]">{cat.icon}</span>
                        </div>
                        <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {cat.label}
                        </span>
                        <span
                          className={`text-xs mt-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {cat.subtext}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white text-emerald-800 flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Portions */}
              <div className="flex flex-col gap-1.5" id="field-portions">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1" htmlFor="portion-count">
                    How many portions
                    <span className="text-amber-700">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePortionAdjust(-5)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-sm font-bold transition-colors"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePortionAdjust(10)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-sm font-bold transition-colors"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-emerald-800 transition-colors flex items-center ml-1 cursor-pointer"
                      onClick={() => setHelpModalKey('help-portions')}
                    >
                      <span className="material-symbols-outlined text-[18px]">info</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="portion-count"
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={portions}
                    onChange={(e) => setPortions(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base font-semibold"
                  />
                  <span className="absolute right-4 top-3 text-sm font-medium text-slate-500">
                    plates / boxes
                  </span>
                </div>
                <p className="text-xs text-slate-500">One portion feeds one person</p>
                {errors.portions && (
                  <p className="text-xs font-semibold text-rose-600">{errors.portions}</p>
                )}
              </div>

              {/* Field 4: Pickup Location */}
              <div className="flex flex-col gap-1.5" id="field-location">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1" htmlFor="pickup-address">
                    Pickup location
                    <span className="text-amber-700">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={autoFillLocation}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">my_location</span> Auto-fill my canteen
                  </button>
                </div>
                <PlacePicker
                  id="pickup-address"
                  required
                  value={location}
                  onChange={(val) => setLocation(val)}
                  onSelectCoords={(lat, lng) => setBatchCoords({ lat, lng })}
                  placeholder="Street address, back entrance loading bay, floor..."
                />
                <p className="text-xs text-slate-500">Where the NGO volunteer should arrive with their vehicle or crates</p>
                {errors.location && (
                  <p className="text-xs font-semibold text-rose-600">{errors.location}</p>
                )}
              </div>

              {/* Field 5: Freshness Window */}
              <div className="flex flex-col gap-2" id="field-freshness">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1">
                    Fresh for how many hours
                    <span className="text-amber-700">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-emerald-800 transition-colors flex items-center cursor-pointer"
                    onClick={() => setHelpModalKey('help-freshness')}
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[2, 4, 6, 12].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                        selectedHours === h && !customHours
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    <input
                      id="custom-hours"
                      type="number"
                      min="1"
                      max="48"
                      value={customHours}
                      onChange={(e) => handleCustomHourInput(e.target.value)}
                      placeholder="Custom"
                      className="w-16 h-7 text-center bg-white rounded-full text-slate-900 text-xs font-semibold outline-none border border-slate-200"
                    />
                    <span className="text-xs text-slate-500 font-semibold pr-1">hrs</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Choose how long this food stays safe to eat at ambient temperature</p>
              </div>

              {/* Diet & Storage Badges */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-sm font-bold text-slate-900">Dietary & Handling Tags (Optional)</span>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={isVegetarian}
                      onChange={(e) => setIsVegetarian(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-0"
                    />
                    <span>Vegetarian</span>
                  </label>
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={isHalal}
                      onChange={(e) => setIsHalal(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-0"
                    />
                    <span>Halal certified</span>
                  </label>
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={isBoxesProvided}
                      onChange={(e) => setIsBoxesProvided(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-0"
                    />
                    <span>Boxes provided</span>
                  </label>
                </div>
              </div>

              {/* Big Friendly Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[24px]">send</span>
                  <span>{isSubmitting ? 'Broadcasting notice...' : 'Share this food now'}</span>
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Notice pings 14 registered pantries within a 4.5km radius instantaneously.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mirrored Preview Card + Safety Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            {/* Live Preview Wrapper */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Preview</span>
                </div>
                <span className="text-xs text-slate-500">How NGOs will see your listing</span>
              </div>

              {/* The Real-time Card NGOs See */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
                {/* Card Top: Category Icon + Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">{activeCategory.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{activeCategory.label}</h3>
                      <p className="text-xs text-slate-500">{donorName || 'Your Organisation'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase shrink-0">
                    Available
                  </span>
                </div>

                {/* Card Visual Snippet */}
                <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-inner">
                  <img
                    className="w-full h-full object-cover"
                    alt="Artisanal freshly baked food portions resting on clean trays"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUvA1Dxpd-qJ6qb4TKtTMeKms6WOCYs5D-JQKDGuE0bkc0uI1Vo7MyZr4sTHpMuxE0C1nlalY2d0ghJekAZfieMLmTGNgxZ2YuTUMwlYDvPtfZmDIvJlq4VBUzAGGp6YXFvKXKERzniOZLtKgcgZkgVmGnqAb2aO0ZFHX01eAzBCXnIwLUv3vyZXCeibIssul0JnozY3YCbNmWhxufNwoLkuUR-CX-OmAjtjtULInxoyNfLypL6GjZ"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">dinner_dining</span>
                    <span>{portions || '0'} portions ready</span>
                  </div>
                </div>

                {/* Card Middle: Key Metadata Badges */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Food Safety Window</span>
                    <span className="text-sm sm:text-base font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      Expires in {selectedHours}h 00m
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Volunteers Needed</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">1 vehicle / cargo</span>
                  </div>
                </div>

                {/* Card Bottom: Pickup Address & Tags */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">pin_drop</span>
                    <span className="text-xs text-slate-700 truncate font-medium">
                      {location || 'Address will appear here'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {isVegetarian && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">Vegetarian</span>
                    )}
                    {isHalal && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">Halal certified</span>
                    )}
                    {isBoxesProvided && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">Boxes provided</span>
                    )}
                  </div>
                </div>

                {/* Simulated NGO Action */}
                <div className="pt-1">
                  <div className="w-full h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium cursor-not-allowed">
                    <span className="material-symbols-outlined text-[16px] mr-1">lock</span>
                    NGO Claiming Action Enabled On Publish
                  </div>
                </div>
              </div>

              {/* Rescue Safety Mini Assurance */}
              <div className="mt-4 flex items-start gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-emerald-800 text-[20px] shrink-0 mt-0.5">verified_user</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-950">100% Protected Community Rescue</span>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Food donations made in good faith are shielded under the Good Samaritan Food Act. All receiving NGOs sign strict safe-consumption waivers upon pickup.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Hotline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[24px]">support_agent</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Need urgent cold-chain pickup?</p>
                  <p className="text-xs text-slate-500">Call Central Kitchen Dispatch: (555) 019-8234</p>
                </div>
              </div>
              <a
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-amber-800 font-semibold text-xs transition-all shadow-sm"
                href="tel:5550198234"
              >
                Direct line
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4 relative">
            <button
              type="button"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              onClick={() => setConfirmationBatch(null)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mb-1">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Instant Dispatch Active</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">Thank you! Your food is now visible to nearby NGOs.</h2>
              <p className="text-sm text-slate-600 mt-1">
                Your donation has been broadcasted to registered shelters within your radius. You will receive an SMS as soon as a courier claims the pickup.
              </p>
            </div>
            {/* Batch Detail Card */}
            <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between text-left my-2">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500">Batch Reference ID</span>
                <p className="text-xl font-extrabold text-emerald-950">#{confirmationBatch.id}</p>
                <p className="text-xs text-slate-600">
                  {confirmationBatch.quantity} portions • {confirmationBatch.category}
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                  Broadcasting
                </span>
                <p className="text-xs text-slate-500 mt-1">Est. arrival: 25 mins</p>
              </div>
            </div>
            {/* Modal Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                className="w-full sm:w-1/2 h-12 rounded-full bg-emerald-800 text-white font-bold text-sm shadow-sm hover:bg-emerald-900 transition-all cursor-pointer"
                onClick={() => {
                  setTrackBatchId(confirmationBatch.id);
                  onNavigateToNGO(confirmationBatch.id);
                }}
              >
                Track this batch
              </button>
              <button
                type="button"
                className="w-full sm:w-1/2 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
                onClick={prepareAnotherDonation}
              >
                Donate another batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Donations Section */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My donations</h2>
            <button
              type="button"
              className="text-slate-400 hover:text-emerald-800 transition-colors flex items-center cursor-pointer"
              onClick={() => setHelpModalKey('help-history')}
              title="Learn about donation status tracking"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
          </div>
          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTableFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                tableFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All donations
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Available')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                tableFilter === 'Available'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Claimed')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                tableFilter === 'Claimed'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Claimed ({claimedCount})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Expired')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                tableFilter === 'Expired'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Expired ({expiredCount})
            </button>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Batch ID</th>
                  <th className="py-4 px-4">Category &amp; Details</th>
                  <th className="py-4 px-4">Portions</th>
                  <th className="py-4 px-4">Time Remaining</th>
                  <th className="py-4 px-4">Live Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No donations found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((batch) => {
                    const diffMs = new Date(batch.expiryTime).getTime() - Date.now();
                    const hoursLeft = Math.max(0, Math.floor(diffMs / 3600000));
                    const minsLeft = Math.max(0, Math.floor((diffMs % 3600000) / 60000));

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-emerald-950 font-mono text-base">
                          #{batch.id}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[20px]">
                                {batch.category === 'Cooked meal'
                                  ? 'soup_kitchen'
                                  : batch.category === 'Bakery'
                                  ? 'bakery_dining'
                                  : batch.category === 'Fruit and vegetables'
                                  ? 'nutrition'
                                  : batch.category === 'Packaged food'
                                  ? 'inventory_2'
                                  : 'egg'}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{batch.category}</p>
                              <p className="text-xs text-slate-500">
                                {batch.donor} • {batch.location}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 text-base">{batch.quantity}</span>
                          <span className="text-xs text-slate-500 ml-1">meals</span>
                        </td>
                        <td className="py-4 px-4">
                          {batch.status === 'Available' ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span> {hoursLeft}h {minsLeft}m left
                              </span>
                              <span className="text-xs text-slate-500">Available for rescue</span>
                            </div>
                          ) : batch.status === 'Claimed' ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">local_shipping</span> Courier in-transit
                              </span>
                              <span className="text-xs text-slate-500">
                                Claimed by {batch.claimedBy || 'Verified NGO'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500">Window lapsed</span>
                              <span className="text-xs text-slate-400">Composted responsibly</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {batch.status === 'Available' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                              Available
                            </span>
                          ) : batch.status === 'Claimed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold uppercase">
                              <span className="material-symbols-outlined text-[14px]">event_busy</span>
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {batch.status === 'Available' ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(JSON.stringify(batch, null, 2));
                                alert(`Batch #${batch.id} details copied to clipboard!`);
                              }}
                              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Details
                            </button>
                          ) : batch.status === 'Claimed' ? (
                            <button
                              type="button"
                              onClick={() => alert(`Courier dispatched for Batch #${batch.id} to ${batch.claimedBy}. Tracking active.`)}
                              className="px-3 py-1 rounded-full bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-all cursor-pointer"
                            >
                              Track Courier
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={relistExpired}
                              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Relist Fresh
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Plain Language Help Dialog Modal */}
      {helpModalKey && HELP_EXPLANATIONS[helpModalKey] && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-3 relative border border-slate-200">
            <button
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setHelpModalKey(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {HELP_EXPLANATIONS[helpModalKey].title}
              </h3>
            </div>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {HELP_EXPLANATIONS[helpModalKey].body}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-emerald-800 text-white font-semibold text-xs cursor-pointer hover:bg-emerald-900"
                onClick={() => setHelpModalKey(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
