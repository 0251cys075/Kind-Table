import React, { useState } from 'react';
import { useLiveAlerts } from '../context/LiveAlertsContext';
import type { FoodBatch } from '../types';

interface HomePageProps {
  onNavigate: (tab: string, batchId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { availableBatches, refreshData } = useLiveAlerts();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [claimingBatchId, setClaimingBatchId] = useState<string | null>(null);

  const totalPortionsAvailable = availableBatches.reduce((acc, b) => acc + b.quantity, 0);

  // Fallback demo batches if live available batches is less than 3
  const demoBatches: FoodBatch[] = [
    {
      id: 'KT-108',
      donor: 'Central Campus Canteen',
      category: 'Cooked meal',
      quantity: 45,
      location: 'Student Union Hub',
      expiryTime: new Date(Date.now() + 75 * 60000).toISOString(),
      status: 'Available',
      claimedBy: null,
      claimedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'KT-104',
      donor: 'Artisan Bakehouse & Deli',
      category: 'Bakery',
      quantity: 28,
      location: '12 Market Lane',
      expiryTime: new Date(Date.now() + 220 * 60000).toISOString(),
      status: 'Available',
      claimedBy: null,
      claimedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'KT-102',
      donor: 'City Terminal Wholesale',
      category: 'Fruit and vegetables',
      quantity: 35,
      location: 'Dock 4, Terminal Ave',
      expiryTime: new Date(Date.now() + 380 * 60000).toISOString(),
      status: 'Available',
      claimedBy: null,
      claimedAt: null,
      createdAt: new Date().toISOString(),
    },
  ];

  // Combined batches for display
  const displayBatches = availableBatches.length >= 3 
    ? availableBatches.slice(0, 3) 
    : [...availableBatches, ...demoBatches.slice(availableBatches.length, 3)];

  const toggleTooltip = (id: string) => {
    setActiveTooltip((prev) => (prev === id ? null : id));
  };

  const handleClaim = async (batch: FoodBatch) => {
    setClaimingBatchId(batch.id);
    try {
      const res = await fetch(`/api/batches/${batch.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName: 'Hope Shelter NGO' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not claim batch');
      }

      await refreshData();
      alert(`Batch #${batch.id} (${batch.donor}) claimed successfully! Dispatch directions sent to your verified NGO contact.`);
    } catch (err: unknown) {
      alert((err as Error).message || 'Claim error');
    } finally {
      setClaimingBatchId(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col w-full pb-16 font-sans">
      {/* Dynamic Notification Pill Anchor */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="inline-flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm text-slate-800 text-xs sm:text-sm">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
          </span>
          <span className="font-bold text-emerald-950">Live Rescue Signal</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">
            🥘 <strong className="text-slate-900 font-bold">{totalPortionsAvailable || 184} portions</strong> of wholesome food available right now across {availableBatches.length || 6} nearby batches
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full">
                Community Resilience Network
              </span>
              <span className="text-xs font-semibold text-slate-500">Hyperlocal Zero-Waste</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Good food, <br />
              <span className="text-amber-700 italic font-serif">shared in time.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Restaurants, hostels, and canteens list wholesome food they cannot use. Nearby NGOs claim it instantly before it spoils—zero fuss, absolute food dignity.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('donor')}
                className="inline-flex items-center justify-center gap-2 bg-emerald-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-md hover:bg-emerald-900 transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-200">soup_kitchen</span>
                <span>I have food to share</span>
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ngo')}
                className="inline-flex items-center justify-center gap-2 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-sm hover:bg-amber-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] text-amber-800">diversity_1</span>
                <span>I am an NGO or volunteer</span>
              </button>
            </div>

            {/* Micro stats strip */}
            <div className="flex items-center gap-6 pt-2 text-slate-600 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-800 text-[20px]">timer</span>
                <span><strong className="text-slate-900">4.2 mins</strong> avg. claim time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-800 text-[20px]">verified</span>
                <span><strong className="text-slate-900">100% verified</strong> food receivers</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-slate-200 border border-slate-200">
              <img
                className="w-full h-full object-cover"
                alt="Community kitchen staff and volunteer safely packing fresh wholesome meal portions"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuZBuGI-jNaFUYNjYYFDihsfpSjgereAvtRu_CoWEGpIxTCjJkIbk172SHMlYedFaJQh8DkreDQaTulVxH4L25M5qeLcMa2qq1YIZoxMNeqBU04Ebpfc9FXRoBIksH1ir1ZXflfULIM2pS3hzS6o29Gc0QeKz5BfvWo7fFTpthkU4jqJEX8FYmjdifcXHNQJmjMOFkoAhEmWlY2wCvcMTwbQWnWqjeQ_0bMbgQrTwd3R8U54R0sPvy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent"></div>
              {/* Floating badge overlay */}
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Pantry Delivery En Route</span>
                    <span className="text-xs text-slate-500">Maple Shelter • 62 meals secured</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Just Now
                </span>
              </div>
            </div>
            {/* Accent tag */}
            <div className="absolute -top-3 -right-3 hidden sm:flex bg-amber-600 text-white px-3.5 py-1 rounded-full shadow-md text-xs font-bold items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">eco</span>
              Zero Landfill Goal
            </div>
          </div>
        </div>
      </section>

      {/* Live Food Available Right Now Preview Ticker */}
      <section className="w-full bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold tracking-wider uppercase mb-1">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>READY FOR IMMEDIATE PICKUP</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Live Food Dispatch Stream</h2>
              <p className="text-base text-slate-600 mt-1">
                Hot batches, artisan bakery surplus, and farm crates requiring rescue right now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ngo')}
              className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold text-sm cursor-pointer"
            >
              <span>Explore all {availableBatches.length || 6} active listings</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Demo Batch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayBatches.map((batch, index) => {
              const diffMs = new Date(batch.expiryTime).getTime() - Date.now();
              const totalMin = Math.max(1, Math.floor(diffMs / 60000));
              const hours = Math.floor(totalMin / 60);
              const mins = totalMin % 60;
              const isUrgent = totalMin < 90;
              const progressWidth = index === 0 ? '78%' : index === 1 ? '45%' : '25%';

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isUrgent ? (
                        <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          Expires in {hours > 0 ? `${hours}h ` : ''}{mins}m
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Expires in {hours > 0 ? `${hours}h ` : ''}{mins}m
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[16px]">near_me</span>
                        {(0.8 + index * 0.6).toFixed(1)} km
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                      {batch.quantity} {batch.category === 'Cooked meal' ? 'Fresh Cooked Thali Portions' : batch.category === 'Bakery' ? 'Sourdough & Sandwich Breads' : 'Crates Fresh Produce'}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {batch.donor} • Prepared recently
                    </p>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden border border-slate-200/50">
                      <div
                        className={`${isUrgent ? 'bg-amber-600' : 'bg-emerald-700'} h-full rounded-full transition-all`}
                        style={{ width: progressWidth }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">
                        {batch.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">
                        Verified Kitchen
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">
                        Insulated
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400">Pickup Window</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">Until {((hours + 12) % 24)}:00 today</span>
                    </div>
                    <button
                      type="button"
                      disabled={claimingBatchId === batch.id}
                      onClick={() => handleClaim(batch)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {claimingBatchId === batch.id ? 'Securing lock...' : 'Claim Batch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Process Strip (Clean White Container) */}
      <section className="w-full bg-white border-b border-slate-200 py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Fast &amp; Human</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">How Kind Table Rescues Good Food</h2>
            <p className="text-base text-slate-600 mt-2">
              Simple coordination that respects the rush of commercial kitchens and the real needs of community shelters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col items-start hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-5 font-bold shadow-sm">
                <span className="material-symbols-outlined text-[28px]">post_add</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase">STEP 01</span>
                <span className="text-slate-400 text-xs">• Under 60 seconds</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Donor lists food</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A restaurant, hotel, or canteen snaps a photo and logs fresh surplus in three simple taps. No complex forms during closing shift.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col items-start hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 mb-5 font-bold shadow-sm">
                <span className="material-symbols-outlined text-[28px]">notifications_active</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase">STEP 02</span>
                <span className="text-slate-400 text-xs">• Real-time broadcast</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">NGO sees it instantly</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nearby shelters, soup kitchens, and verified volunteers get notified based on distance, quantity, and dietary compatibility.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col items-start hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 flex items-center justify-center text-white mb-5 font-bold shadow-sm">
                <span className="material-symbols-outlined text-[28px]">volunteer_activism</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase">STEP 03</span>
                <span className="text-slate-400 text-xs">• Zero confusion</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">One NGO claims &amp; picks up</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The first responder locks the batch exclusively, coordinates pickup window, and serves wholesome meals to community members today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hyperlocal Distribution Section */}
      <section className="w-full bg-slate-100/70 border-b border-slate-200 py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Hyperlocal Distribution
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">Every kilometer matters when the clock is ticking.</h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Our algorithmic dispatch calculates travel radius, food holding temperature, and volunteer vehicle capacities to ensure items arrive piping hot and food-safe.
              </p>
              {/* Metrics Bento preview */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-4xl font-extrabold text-emerald-950">98.4%</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Safe consumption success rate</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-4xl font-extrabold text-amber-700">12 min</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Average volunteer dispatch time</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div
                  className="relative w-full h-[320px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                  style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  <div className="absolute inset-0 bg-emerald-900/5 flex items-center justify-center">
                    {/* Illustrated overlay map markers */}
                    <div className="bg-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 border border-slate-200">
                      <span className="material-symbols-outlined text-amber-600 animate-bounce">location_on</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                          Live Rescue Corridor: West End &amp; Campus
                        </span>
                        <span className="text-xs text-slate-500">
                          4 Active Couriers On Route
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 px-2 text-xs text-slate-500">
                  <span>● Real-time GPS &amp; Safe Radius Geo-fencing</span>
                  <span className="text-emerald-800 font-bold">City Hub #4 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Row */}
      <section className="w-full bg-white border-b border-slate-200 py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Safe, Fair &amp; Transparent</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Built on Radical Integrity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trust 1 */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <span className="material-symbols-outlined text-[24px]">lock_clock</span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">One NGO per Batch</h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer"
                  onClick={() => toggleTooltip('tooltip-lock')}
                >
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero duplicates or double bookings. Atomic reservation locks ensure volunteers never travel to collect a batch claimed by another shelter.
              </p>
              {activeTooltip === 'tooltip-lock' && (
                <div className="text-xs bg-white border border-slate-200 p-3 rounded-xl text-slate-700 shadow-sm">
                  Database guarantees instant atomic state locking with zero race conditions.
                </div>
              )}
            </div>
            {/* Trust 2 */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <span className="material-symbols-outlined text-[24px]">history_edu</span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Every Step Recorded</h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer"
                  onClick={() => toggleTooltip('tooltip-audit')}
                >
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clear, immutable audit trails. From temperature checks at donor pickup to physical sign-off at shelter receipt, hygiene protocols are verifiable.
              </p>
              {activeTooltip === 'tooltip-audit' && (
                <div className="text-xs bg-white border border-slate-200 p-3 rounded-xl text-slate-700 shadow-sm">
                  Conforms to standard municipal food safety act reporting and transparent logging.
                </div>
              )}
            </div>
            {/* Trust 3 */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
                <span className="material-symbols-outlined text-[24px]">auto_delete</span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Automatic Expiry Clears</h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer"
                  onClick={() => toggleTooltip('tooltip-expiry')}
                >
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                No stale listings cluttering notifications. Unclaimed food reaches its safety window and automatically disappears or diverts to composting partners.
              </p>
              {activeTooltip === 'tooltip-expiry' && (
                <div className="text-xs bg-white border border-slate-200 p-3 rounded-xl text-slate-700 shadow-sm">
                  Guarantees zero risk of delivering past safe consumption hours.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SDG & Community Impact Banner */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 my-10 w-full">
        <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700 px-3 py-1 rounded-full w-fit">
                <span className="material-symbols-outlined text-emerald-300 text-[18px]">verified_user</span>
                <span className="text-xs font-bold tracking-wider text-emerald-200 uppercase">
                  Built by Group 76
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white">
                Proudly supporting UN SDG 2: Zero Hunger &amp; Food Dignity
              </h2>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                We believe that surplus food is not waste—it is wholesome nourishment that belongs on community tables. Our open infrastructure empowers grassroots kitchens with digital coordination tools.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="bg-emerald-900/80 border border-emerald-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                  2
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">UN SDG Target 2.1 &amp; 12.3</span>
                  <span className="text-xs text-emerald-200/90">
                    Universal food access &amp; halving global food waste
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-950 px-5 py-3 rounded-full text-sm font-bold hover:bg-emerald-50 transition-all cursor-pointer shadow-sm"
              >
                <span>Read Safety &amp; Dignity Charter</span>
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
