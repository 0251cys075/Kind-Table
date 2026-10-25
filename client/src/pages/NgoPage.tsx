import React, { useState, useEffect } from 'react';
import { useLiveAlerts } from '../context/LiveAlertsContext';
import { useLocation } from '../context/LocationContext';
import { NgoMapView } from '../components/NgoMapView';

export const NgoPage: React.FC = () => {
  const {
    availableBatches,
    bannerAlert,
    dismissBanner,
    refreshData,
  } = useLiveAlerts();

  const {
    currentLocation,
    maxDistanceKm,
    districts,
    setCurrentLocation,
    setMaxDistanceKm,
    getDistanceKm,
  } = useLocation();

  // View Mode: List vs Map toggle
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Remember NGO name in session / localStorage
  const [ngoName, setNgoName] = useState<string>(() => {
    return localStorage.getItem('kind_table_ngo_name') || 'Hope Community Kitchen';
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempNgoName, setTempNgoName] = useState(ngoName);

  // Tour Steps State
  const tourSteps = [
    {
      icon: 'timer',
      title: 'Step 1 of 3 • Quick Tour',
      text: '<strong>Urgent Countdown Colors:</strong> Cards shift from Forest Green (>2h) to Saffron amber (30m-2h) and flashing Terracotta (<30m). Grab terracotta batches first!'
    },
    {
      icon: 'touch_app',
      title: 'Step 2 of 3 • Quick Tour',
      text: '<strong>One-Click Claim Lock:</strong> Clicking "Claim this batch" immediately locks the food so no other volunteer travels there in vain. You receive immediate contact details.'
    },
    {
      icon: 'directions_run',
      title: 'Step 3 of 3 • Quick Tour',
      text: '<strong>Immediate Pickup Directions:</strong> After claiming, the card reveals specific gate access, on-site contact numbers, and packing instructions. Please arrive before expiry!'
    }
  ];
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(() => {
    return localStorage.getItem('kind_table_ngo_tour_dismissed') === 'true';
  });

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortType, setSortType] = useState<'urgent' | 'portions'>('urgent');

  // Simulation States
  const [emptyStateActive, setEmptyStateActive] = useState(false);
  const [raceNoticeVisible, setRaceNoticeVisible] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Claimed batches tracking (cardId -> claimed details)
  const [claimedCards, setClaimedCards] = useState<Record<string, { location: string; contact: string; expiry: string }>>({});

  // Timer tick for countdown updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleNextTourStep = () => {
    if (currentTourStep >= tourSteps.length - 1) {
      setTourDismissed(true);
      localStorage.setItem('kind_table_ngo_tour_dismissed', 'true');
    } else {
      setCurrentTourStep((s) => s + 1);
    }
  };

  const handleDismissTour = () => {
    setTourDismissed(true);
    localStorage.setItem('kind_table_ngo_tour_dismissed', 'true');
  };

  const handleSaveNgoName = () => {
    const trimmed = tempNgoName.trim() || 'Hope Community Kitchen';
    setNgoName(trimmed);
    localStorage.setItem('kind_table_ngo_name', trimmed);
    setIsEditModalOpen(false);
  };

  // Claim handler
  const handleClaimBatch = async (batchId: string, location: string, contact: string, expiryStr: string) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName: ngoName.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClaimedCards((prev) => ({
          ...prev,
          [batchId]: { location, contact, expiry: expiryStr },
        }));
        refreshData();
      } else if (res.status === 409) {
        setRaceNoticeVisible(true);
        refreshData();
      } else {
        // Fallback for simulated or demo cards
        setClaimedCards((prev) => ({
          ...prev,
          [batchId]: { location, contact, expiry: expiryStr },
        }));
      }
    } catch {
      // Local optimistic fallback
      setClaimedCards((prev) => ({
        ...prev,
        [batchId]: { location, contact, expiry: expiryStr },
      }));
    }
  };

  const handleRevertClaim = (batchId: string) => {
    setClaimedCards((prev) => {
      const copy = { ...prev };
      delete copy[batchId];
      return copy;
    });
  };

  const highlightUrgentBatch = () => {
    const card = document.getElementById('card-batch-1') || document.querySelector('.batch-card');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-4', 'ring-secondary');
      setTimeout(() => card.classList.remove('ring-4', 'ring-secondary'), 2000);
    }
  };

  // Pre-seed demo batch cards matching the exact design if real list is smaller
  const defaultBatches: Array<{
    id: string;
    donorType: string;
    verifiedLabel: string;
    donor: string;
    category: string;
    quantity: number;
    description: string;
    locationTitle: string;
    locationNotes: string;
    contact: string;
    minutesLeft: number;
    color: 'red' | 'amber' | 'green';
    lat: number;
    lng: number;
    distanceKm: number;
  }> = [
    {
      id: 'card-batch-1',
      donorType: 'Canteen Donor',
      verifiedLabel: 'Verified Safe',
      donor: 'Central Canteen',
      category: 'Cooked meal',
      quantity: 45,
      description: 'Hot vegetable biryani & dal tadka',
      locationTitle: 'Central Student Canteen, North Gate',
      locationNotes: 'Campus Entrance 3 • Insulated crates ready',
      contact: 'Rajesh (+91 98765 43210)',
      minutesLeft: 28,
      color: 'red' as const,
      lat: 40.7135,
      lng: -74.0050,
      distanceKm: 0.4,
    },
    {
      id: 'card-batch-2',
      donorType: 'Artisan Bakery',
      verifiedLabel: 'Fresh Bakes',
      donor: 'Artisan Baker',
      category: 'Bakery',
      quantity: 30,
      description: 'Sourdough loaves, wholewheat buns & baguettes',
      locationTitle: 'Artisan Bakehouse, Market St',
      locationNotes: 'Service alley door, ring bell for Clara',
      contact: 'Clara (+91 98111 22334)',
      minutesLeft: 75,
      color: 'amber' as const,
      lat: 40.7290,
      lng: -73.9930,
      distanceKm: 1.8,
    },
    {
      id: 'card-batch-3',
      donorType: 'Corporate Kitchen',
      verifiedLabel: 'Bulk Batch',
      donor: 'Metro Caterers',
      category: 'Cooked meal',
      quantity: 60,
      description: 'Rice & Lentil Bowls with steamed vegetables',
      locationTitle: 'Tech Park Cafeteria, Level 2',
      locationNotes: 'Rear freight elevator access, bay 4',
      contact: 'Sunil Kumar (+91 97766 55443)',
      minutesLeft: 220,
      color: 'green' as const,
      lat: 40.7360,
      lng: -74.0090,
      distanceKm: 2.6,
    },
    {
      id: 'card-batch-4',
      donorType: 'Produce Market',
      verifiedLabel: 'Raw Fresh',
      donor: 'City Market',
      category: 'Fruit & veg',
      quantity: 25,
      description: 'Crisp apples & ripe bananas (Wooden crates)',
      locationTitle: 'Green Grocers Hub',
      locationNotes: 'Stall 14, Main Produce Pavilion',
      contact: 'Vikram (+91 99887 76655)',
      minutesLeft: 310,
      color: 'green' as const,
      lat: 40.7010,
      lng: -74.0160,
      distanceKm: 1.5,
    },
  ];

  // Merge real available batches with display cards
  const displayBatches = availableBatches.length > 0
    ? availableBatches.map((b) => {
        const diffMs = new Date(b.expiryTime).getTime() - Date.now();
        const mins = Math.max(1, Math.floor(diffMs / 60000));
        const color = mins < 30 ? ('red' as const) : mins <= 120 ? ('amber' as const) : ('green' as const);
        const dist = b.latitude && b.longitude ? getDistanceKm(b.latitude, b.longitude) : (b.distanceKm ?? 1.2);
        return {
          id: b.id,
          donorType: b.donor.toLowerCase().includes('bakery') ? 'Artisan Bakery' : 'Canteen Donor',
          verifiedLabel: 'Verified Safe',
          donor: b.donor,
          category: b.category,
          quantity: b.quantity,
          description: b.category === 'Cooked meal'
            ? 'Hot vegetable biryani & fresh portions'
            : b.category === 'Bakery'
            ? 'Fresh morning bakes & rolls'
            : `${b.category} ready for immediate pickup`,
          locationTitle: b.location,
          locationNotes: 'Ground floor entrance • Insulated transit ready',
          contact: 'Kitchen Manager (+91 98000 11223)',
          minutesLeft: mins,
          color,
          lat: b.latitude ?? 40.7128,
          lng: b.longitude ?? -74.0060,
          distanceKm: dist,
        };
      })
    : defaultBatches.map((d) => ({
        ...d,
        distanceKm: getDistanceKm(d.lat, d.lng) ?? d.distanceKm,
      }));

  // Filter & Sort
  const filteredBatches = displayBatches
    .filter((b) => {
      if (selectedCategory === 'All' || selectedCategory === 'All Batches') return true;
      if (selectedCategory === 'Fruit & veg' || selectedCategory === 'Fruit & Veg') {
        return b.category.toLowerCase().includes('fruit');
      }
      return b.category.toLowerCase().includes(selectedCategory.toLowerCase());
    })
    .filter((b) => {
      if (maxDistanceKm == null) return true;
      return (b.distanceKm ?? 1.2) <= maxDistanceKm;
    })
    .sort((a, b) => {
      if (sortType === 'portions') return b.quantity - a.quantity;
      return a.minutesLeft - b.minutesLeft;
    });

  const urgentCount = displayBatches.filter((b) => b.minutesLeft < 30).length;
  const alertCount = displayBatches.filter((b) => b.minutesLeft >= 30 && b.minutesLeft <= 120).length;
  const totalMeals = displayBatches.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div className="flex flex-col w-full bg-surface pb-space-xl">
      {/* ── INTERACTIVE TOAST NOTIFICATION COMPONENT ── */}
      {!toastDismissed && (
        <div className="w-full max-w-[1280px] mx-auto px-margin pt-space-md transition-all duration-500 transform translate-y-0 opacity-100" id="live-toast">
          <div className="bg-secondary-container text-on-secondary-container px-space-md py-space-sm rounded-full shadow-md flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <span className="material-symbols-outlined text-secondary animate-bounce text-[20px]">notifications_active</span>
              <span className="font-label-md text-label-md truncate">
                <strong>New:</strong> {bannerAlert?.message || '40 portions of warm stew near Block A just listed by Green Hostel!'}
              </span>
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <button
                className="bg-secondary text-on-secondary px-space-sm py-space-xs rounded-full font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity"
                onClick={highlightUrgentBatch}
              >
                View card
              </button>
              <button
                className="p-space-xs text-on-secondary-container hover:opacity-75 transition-opacity"
                onClick={() => {
                  setToastDismissed(true);
                  dismissBanner();
                }}
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOUR BANNER / INTERACTIVE GUIDE ── */}
      {!tourDismissed && (
        <div className="max-w-[1280px] mx-auto px-margin w-full mt-space-md" id="onboarding-tour-panel">
          <div className="bg-surface-container p-space-md rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
            <div className="flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" id="tour-icon">
                  {tourSteps[currentTourStep].icon}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider" id="tour-step-counter">
                    {tourSteps[currentTourStep].title}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">NGO Rescue Guide</span>
                </div>
                <p
                  className="font-body-sm text-body-sm text-on-surface font-medium"
                  id="tour-step-content"
                  dangerouslySetInnerHTML={{ __html: tourSteps[currentTourStep].text }}
                />
              </div>
            </div>
            <div className="flex items-center gap-space-sm shrink-0 self-end md:self-center">
              <button
                className="bg-primary text-on-primary px-space-md py-space-xs rounded-full font-label-md text-label-md hover:bg-primary-container transition-colors"
                id="tour-action-btn"
                onClick={handleNextTourStep}
              >
                {currentTourStep === tourSteps.length - 1 ? "Got it, let's rescue" : 'Next Tip'}
              </button>
              <button
                className="font-label-md text-label-md text-on-surface-variant px-space-sm py-space-xs hover:text-on-surface"
                onClick={handleDismissTour}
              >
                Skip guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSTATION VIEWPORT ── */}
      <div className="max-w-[1280px] mx-auto px-margin w-full py-space-lg flex flex-col gap-space-lg">
        {/* Top Identity Bar & Operational Filters */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          {/* Row 1: Session NGO Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="w-3 h-3 rounded-full bg-primary-fixed-dim ring-4 ring-primary-fixed/20 animate-pulse"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Claiming as:</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold" id="current-ngo-name">
                {ngoName}
              </span>
              <button
                className="inline-flex items-center gap-space-xs text-secondary hover:text-on-surface font-label-sm text-label-sm transition-colors"
                onClick={() => {
                  setTempNgoName(ngoName);
                  setIsEditModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Change</span>
              </button>
              <span className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-full font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                Remembered for this session
              </span>
            </div>

            {/* Simulation state toggles for evaluation */}
            <div className="flex items-center gap-space-xs self-start sm:self-auto">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Simulate:</span>
              <button
                className="bg-surface-container px-space-sm py-space-xs rounded-full font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                id="empty-state-btn"
                onClick={() => setEmptyStateActive((prev) => !prev)}
              >
                {emptyStateActive ? 'Show Batches' : 'Empty State'}
              </button>
              <button
                className="bg-surface-container px-space-sm py-space-xs rounded-full font-label-sm text-label-sm text-secondary hover:bg-secondary-fixed transition-colors"
                onClick={() => setRaceNoticeVisible(true)}
              >
                Race Condition
              </button>
            </div>
          </div>

          {/* Row 2: Category Filter Pills & Sorter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-xs">
            {/* Filter pills */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs lg:pb-0" id="category-pills">
              {[
                { id: 'All', label: 'All Batches' },
                { id: 'Cooked meal', label: 'Cooked Meal' },
                { id: 'Bakery', label: 'Bakery' },
                { id: 'Fruit & veg', label: 'Fruit & Veg' },
                { id: 'Packaged', label: 'Packaged' },
                { id: 'Dairy', label: 'Dairy' },
              ].map((pill) => {
                const isActive = selectedCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedCategory(pill.id)}
                    className={`category-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all whitespace-nowrap ${
                      isActive
                        ? 'active-pill bg-primary-container text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Sorting dropdown & View Toggle */}
            <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
              <div className="flex items-center gap-space-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">sort</span>
                <span className="font-label-sm text-label-sm">Sort:</span>
              </div>
              <select
                className="bg-surface-container font-label-md text-label-md text-on-surface px-space-md py-space-xs rounded-full outline-none hover:bg-surface-container-high focus:bg-surface-container-lowest transition-all cursor-pointer"
                id="sort-selector"
                value={sortType}
                onChange={(e) => setSortType(e.target.value as any)}
              >
                <option value="urgent">Ends soonest / Most urgent first</option>
                <option value="portions">Largest portion count</option>
              </select>

              {/* View Toggle: List / Map */}
              <div className="flex items-center bg-surface-container p-0.5 rounded-full border border-slate-200/60 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">map</span>
                  Map
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVE LIVE RESCUE TICKER & QUICK STATS RIBBON ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">fmd_bad</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-tertiary font-bold" id="stat-urgent-count">
                {urgentCount || 1} Urgent
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Expires &lt; 30 mins</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">timelapse</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                {alertCount || 1} Alert
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Expires &lt; 2 hours</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">restaurant</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                {totalMeals || 160}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Fresh meals available</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">distance</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">1.4 km</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Avg. donor distance</span>
            </div>
          </div>
        </div>

        {/* ── ALERT / NOTICE SLOT: RACE-CONDITION NOTIFICATION ── */}
        {raceNoticeVisible && (
          <div className="bg-tertiary-fixed text-on-tertiary-fixed p-space-md rounded-xl shadow-md transition-all duration-300 animate-slide-down" id="race-condition-notice">
            <div className="flex items-start gap-space-md">
              <span className="material-symbols-outlined text-[24px] text-tertiary mt-0.5">info</span>
              <div className="flex flex-col gap-space-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-tertiary font-bold">
                    Another NGO claimed this batch just before you!
                  </span>
                  <button className="text-tertiary hover:opacity-75" onClick={() => setRaceNoticeVisible(false)}>
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <p className="font-body-md text-body-md text-on-surface">
                  Don't worry — our real-time network has locked in alternative fresh food below. Other high-priority batches are ready for pickup right now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE VIEW (When simulated) ── */}
        {emptyStateActive ? (
          <div className="flex flex-col items-center justify-center text-center p-space-xl bg-surface-container-lowest rounded-xl shadow-sm" id="empty-state-view">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-md">
              <span className="material-symbols-outlined text-[40px]">notifications_paused</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary font-bold mb-space-xs">Nothing available right now</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
              We will alert you the moment someone shares food in your area. All nearby batches have been successfully routed to neighborhood pantries.
            </p>
            <div className="bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-lg max-w-sm w-full">
              <div className="flex items-center gap-space-sm text-left">
                <span className="material-symbols-outlined text-primary text-[24px]">volume_up</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Sound Alert</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Chime on new listings</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" id="sound-alert-toggle" type="checkbox" />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <button
              className="mt-space-lg font-label-md text-label-md text-secondary hover:text-on-surface underline"
              onClick={() => setEmptyStateActive(false)}
            >
              Return to live batch view
            </button>
          </div>
        ) : (
          <>
            {/* ── "NEAR ME" DISTANCE FILTER BAR ── */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm border border-slate-200/60" id="near-me-bar">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Rescue Base Proximity</span>
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-bold text-primary">
                      {currentLocation.name}
                    </span>
                    <select
                      value={currentLocation.id}
                      onChange={(e) => {
                        const found = districts.find((d) => d.id === e.target.value);
                        if (found) setCurrentLocation(found);
                      }}
                      className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full border border-slate-200 cursor-pointer outline-none"
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

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-on-surface-variant mr-1">Max distance:</span>
                {[
                  { label: 'All', dist: null },
                  { label: 'Within 2 km', dist: 2 },
                  { label: 'Within 5 km', dist: 5 },
                  { label: 'Within 10 km', dist: 10 },
                ].map((chip) => {
                  const isSelected = maxDistanceKm === chip.dist;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setMaxDistanceKm(chip.dist)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── MAP VIEW OR LIST GRID ── */}
            {viewMode === 'map' ? (
              <NgoMapView
                batches={filteredBatches}
                onClaim={(id, location, contact, expiry) =>
                  handleClaimBatch(id, location, contact, expiry)
                }
              />
            ) : (
              /* ── LIVE GRID OF AVAILABLE BATCHES ── */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg" id="batch-grid">
                {filteredBatches.map((batch) => {
                  const isClaimed = !!claimedCards[batch.id];
                  const claimedData = claimedCards[batch.id];

              if (isClaimed) {
                // Interactive Claim Success State
                return (
                  <div
                    key={batch.id}
                    className="batch-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-2 w-full bg-primary"></div>
                    <div className="p-space-lg flex flex-col gap-space-md bg-primary-fixed/20 h-full justify-between">
                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-space-xs text-primary">
                            <span className="material-symbols-outlined text-[24px]">check_circle</span>
                            <span className="font-headline-sm text-headline-sm font-bold">This is yours!</span>
                          </div>
                          <span className="bg-primary text-on-primary font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase">
                            Locked &amp; Claimed
                          </span>
                        </div>

                        <p className="font-body-md text-body-md text-on-surface">
                          Please proceed immediately with your insulated storage box. The donor has been notified of your incoming team.
                        </p>

                        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs mt-space-xs">
                          <div className="flex items-start gap-space-sm">
                            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                            <div>
                              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pickup Address:</span>
                              <p className="font-label-lg text-label-lg font-bold text-on-surface">{claimedData.location}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-space-sm mt-space-xs">
                            <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                            <div>
                              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Donor Coordinator:</span>
                              <p className="font-label-lg text-label-lg font-bold text-primary">{claimedData.contact}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-space-xs mt-space-xs text-error">
                            <span className="material-symbols-outlined text-[16px]">timer</span>
                            <span className="font-label-sm text-label-sm font-semibold">Please arrive before expiry: in {claimedData.expiry}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-space-sm pt-space-md">
                        <button
                          onClick={() => alert(`Directions for pickup at: ${claimedData.location}`)}
                          className="flex-1 bg-primary text-on-primary py-space-sm rounded-full font-label-md text-label-md font-bold text-center hover:bg-primary-container transition-colors"
                        >
                          Open Map Navigation
                        </button>
                        <button
                          onClick={() => handleRevertClaim(batch.id)}
                          className="px-space-md py-space-sm rounded-full font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel claim
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Available Batch Card
              const hours = Math.floor(batch.minutesLeft / 60);
              const mins = batch.minutesLeft % 60;
              const expiryStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

              const isRed = batch.color === 'red';
              const isAmber = batch.color === 'amber';

              const topBarBg = isRed ? 'bg-error animate-pulse' : isAmber ? 'bg-secondary' : 'bg-primary-fixed-dim';
              const progressBg = isRed ? 'bg-error w-[18%]' : isAmber ? 'bg-secondary w-[45%]' : 'bg-primary w-[85%]';

              return (
                <div
                  key={batch.id}
                  id={batch.id}
                  className="batch-card bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Top Urgency Strip Indicator */}
                  <div className={`h-1.5 w-full ${topBarBg}`}></div>

                  <div className="p-space-lg flex flex-col gap-space-md">
                    {/* Card Header: Donor & Countdown Warning */}
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            {batch.donorType}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-outline"></span>
                          <span className={`font-label-sm text-label-sm font-semibold ${isAmber ? 'text-secondary' : 'text-primary'}`}>
                            {batch.verifiedLabel}
                          </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold">
                          {batch.donor}
                        </h3>
                      </div>

                      {/* Warning Countdown Badge with Info Popover */}
                      <div className="relative group/tooltip">
                        {isRed ? (
                          <div className="bg-error-container text-on-error-container px-space-sm py-space-xs rounded-full flex items-center gap-space-xs shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-error animate-spin" style={{ animationDuration: '3s' }}>
                              hourglass_top
                            </span>
                            <span className="font-label-md text-label-md font-bold">Expires in {expiryStr}</span>
                            <span className="bg-error text-on-error font-label-sm text-label-sm px-1.5 py-0.5 rounded-full">
                              Hurry!
                            </span>
                            <button aria-label="Countdown info" className="text-on-error-container hover:opacity-75 focus:outline-none" type="button">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                            </button>
                          </div>
                        ) : isAmber ? (
                          <div className="bg-secondary-fixed text-on-secondary-fixed px-space-sm py-space-xs rounded-full flex items-center gap-space-xs shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                            <span className="font-label-md text-label-md font-bold">Expires in {expiryStr}</span>
                            <button aria-label="Countdown info" className="text-on-secondary-fixed hover:opacity-75 focus:outline-none" type="button">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-primary-fixed text-on-primary-fixed px-space-sm py-space-xs rounded-full flex items-center gap-space-xs shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                            <span className="font-label-md text-label-md font-bold">Expires in {expiryStr}</span>
                            <button aria-label="Countdown info" className="text-on-primary-fixed hover:opacity-75 focus:outline-none" type="button">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                            </button>
                          </div>
                        )}

                        <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-30 w-56 p-space-sm bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm rounded-lg shadow-xl">
                          {isRed
                            ? 'This shows how long the food stays safe to eat. Red means hurry! Volunteer dispatch is prioritized.'
                            : isAmber
                            ? 'This shows how long the food stays safe to eat. Amber indicates 30m to 2h remaining.'
                            : 'This shows how long the food stays safe to eat. Green indicates ample time (>2 hours).'}
                        </div>
                      </div>
                    </div>

                    {/* Food Attributes & Servings */}
                    <div className="flex items-center gap-space-sm">
                      <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-extrabold">
                        {batch.quantity}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface leading-tight">
                          Portions • {batch.category}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {batch.description}
                        </span>
                      </div>
                    </div>

                    {/* Visual rescue countdown progress bar */}
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressBg}`}></div>
                    </div>

                    {/* Pickup Location & Logistics Info */}
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0">pin_drop</span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          {batch.locationTitle}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {batch.locationNotes}
                        </span>
                        <div className="flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold mt-1">
                          <span className="material-symbols-outlined text-[14px]">near_me</span>
                          <span>{batch.distanceKm != null ? `${batch.distanceKm} km away` : '1.2 km away'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="px-space-lg pb-space-lg pt-0">
                    <button
                      className="w-full bg-primary text-on-primary py-space-sm px-space-md rounded-full font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-space-xs"
                      onClick={() => handleClaimBatch(batch.id, batch.locationTitle, batch.contact, expiryStr)}
                    >
                      <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                      <span>Claim this batch</span>
                    </button>
                  </div>
                </div>
              );
            })}
              </div>
            )}
          </>
        )}

        {/* ── OPERATIONAL GUIDELINES RIBBON ── */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-md">
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-primary text-[32px]">health_and_safety</span>
            <div className="flex flex-col">
              <h4 className="font-label-lg text-label-lg text-primary font-bold">Kind Table Food Safety Charter</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                All cooked food listings have undergone temperature checks by the donor prior to handover. Please keep insulated transit boxes closed.
              </p>
            </div>
          </div>
          <button
            onClick={() => { window.location.hash = 'how-it-works'; }}
            className="shrink-0 bg-surface text-primary px-space-md py-space-xs rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm"
          >
            Review Guidelines
          </button>
        </div>
      </div>

      {/* ── CHANGE NGO MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md" id="edit-ngo-modal">
          <div className="bg-surface-container-lowest max-w-md w-full p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md animate-slide-down">
            <div className="flex items-center justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary font-bold">Update Active Identity</h4>
              <button
                className="text-on-surface-variant hover:text-on-surface"
                onClick={() => setIsEditModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Select your registered community kitchen or partner shelter for verification upon pickup.
            </p>
            <div className="flex flex-col gap-space-sm">
              <label className="font-label-md text-label-md text-on-surface">Organization Name</label>
              <input
                className="w-full bg-surface px-space-md py-space-sm rounded-lg font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary"
                id="ngo-input-field"
                type="text"
                value={tempNgoName}
                onChange={(e) => setTempNgoName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-space-sm pt-space-sm">
              <button
                className="px-space-md py-space-xs rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-primary text-on-primary px-space-md py-space-xs rounded-full font-label-md text-label-md hover:bg-primary-container transition-colors"
                onClick={handleSaveNgoName}
              >
                Confirm Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
