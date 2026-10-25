import React, { useState } from 'react';

interface HowItWorksPageProps {
  onNavigate: (tab: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  // FAQ Accordion State (Item 1 open by default)
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 1: true });

  const toggleFaq = (id: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Claim Race Simulation State
  const [simState, setSimState] = useState<'idle' | 'running' | 'completed'>('idle');

  const runRace = () => {
    if (simState === 'running') return;
    setSimState('running');

    // Step 2 & 3 timed sequence matching the simulator script
    setTimeout(() => {
      setSimState('completed');
    }, 750);
  };

  const resetSim = () => {
    setSimState('idle');
  };

  return (
    <div className="flex flex-col w-full bg-surface pb-space-xl">
      {/* ── TOP HERO & STORY RIBBON ── */}
      <section className="relative w-full overflow-hidden py-space-xl sm:py-24">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary-fixed opacity-40 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-primary-fixed opacity-30 blur-3xl pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs self-start px-space-md py-space-xs rounded-full bg-surface-container font-label-md text-label-md text-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                <span>Food Rescue Charter &amp; Protocol</span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight max-w-2xl">
                From surplus trays to warm plates in under{' '}
                <span className="text-secondary italic">68 minutes</span>.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Food doesn't spoil because nobody is hungry—it spoils because coordination is slow. Kind Table turns leftover canteen batches into instant rescue missions with single-claim locking.
              </p>
              <div className="pt-space-sm flex flex-wrap items-center gap-space-md">
                <button
                  onClick={() => onNavigate('donor')}
                  className="inline-flex items-center justify-center gap-space-xs bg-primary text-on-primary px-space-lg py-3 rounded-full font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>List Leftovers Now</span>
                </button>
                <a
                  className="inline-flex items-center justify-center gap-space-xs bg-surface-container text-on-surface px-space-lg py-3 rounded-full font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
                  href="#claim-simulator"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  <span>See Claim Lock Demo</span>
                </a>
              </div>
              <div className="pt-space-md flex flex-wrap items-center gap-space-lg text-on-surface-variant font-label-sm text-label-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <span>Zero double-dispatches</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <span>Temperature window verified</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                  <span>100% free community utility</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative bg-surface-container-lowest rounded-xl p-space-lg shadow-md">
                <div className="flex items-center justify-between pb-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[24px]">soup_kitchen</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Live Loop Monitor</span>
                  </div>
                  <span className="inline-flex items-center px-space-sm py-space-xs rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">
                    Active System
                  </span>
                </div>
                {/* Bento Preview Visual */}
                <div className="flex flex-col gap-space-md">
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage:
                          "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80')",
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-space-md">
                      <span className="font-headline-sm text-headline-sm text-white">District 4 Central Canteen</span>
                    </div>
                  </div>
                  <div className="bg-surface-container rounded-lg p-space-md flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Current batch</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">45 Hearty Veg Curry Meals</p>
                    </div>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase">Time limit</span>
                      <p className="font-label-lg text-label-lg text-tertiary">01h : 42m safe</p>
                    </div>
                  </div>
                  {/* Animated mini status row */}
                  <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">fmd_good</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md text-label-md text-on-surface">Claimed by St. Jude Community Dining</p>
                      <p className="truncate text-on-surface-variant">Courier 0.4 miles away • Arriving 7 mins</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP JOURNEY SECTION ── */}
      <section className="w-full py-space-xl bg-surface-container-low">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Operational Blueprint</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xs">
              The 3-Step Warm Rescue Journey
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
              Designed specifically for rush hours when canteen managers are packing up and shelter kitchens are prepping night tables.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">
            {/* Step 1 Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-space-md">
                <span className="font-display-lg text-display-lg text-primary-fixed-dim font-bold">01</span>
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">edit_note</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                Donor Lists in 60s
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
                Canteen chefs take 1 minute to snap a photo, enter approximate meal count, and declare the food safety window. No tedious forms, no waiting.
              </p>
              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col gap-space-xs">
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">timer</span> Listing duration
                  </span>
                  <span className="font-semibold text-primary">Under 60 sec</span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">thermostat</span> Temp logging
                  </span>
                  <span className="font-semibold text-secondary">Hot (&gt;63°C) or Chilled</span>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-space-md">
                <span className="font-display-lg text-display-lg text-secondary-fixed-dim font-bold">02</span>
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">cell_tower</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                Instant Geo-Broadcast
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
                Our micro-dispatch pings pre-screened neighborhood NGOs, domestic violence shelters, and pantries within a 3-mile perimeter.
              </p>
              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col gap-space-xs">
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">distance</span> Initial alert radius
                  </span>
                  <span className="font-semibold text-primary">3.2 Miles</span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span> Alert dispatch
                  </span>
                  <span className="font-semibold text-secondary">&lt; 0.4s push alert</span>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-space-md">
                <span className="font-display-lg text-display-lg text-primary-fixed-dim font-bold">03</span>
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                Safe Handoff &amp; Dining
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
                The claiming volunteer gets a digital security pass and donor gate instructions. Insulated transport completes delivery straight to dinner tables.
              </p>
              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col gap-space-xs">
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span> Verification
                  </span>
                  <span className="font-semibold text-primary">QR Gate Pass</span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">favorite</span> Community impact
                  </span>
                  <span className="font-semibold text-secondary">Served warm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE EDUCATIONAL CLAIM RACE SIMULATOR ── */}
      <section className="w-full py-space-xl bg-surface" id="claim-simulator">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="bg-surface-container rounded-xl p-space-lg sm:p-space-xl shadow-sm">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-space-lg mb-space-xl">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm mb-space-xs">
                  <span className="material-symbols-outlined text-[14px]">lock</span> Single-Claim Architecture
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  Why can't two NGOs claim the same food?
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                  In traditional messaging groups, multiple volunteers drive out simultaneously for the same 30 boxes—wasting precious fuel and creating heartbreaking gate disputes. Here is how Kind Table solves it mathematically in milliseconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-sm self-stretch lg:self-auto">
                <button
                  onClick={runRace}
                  disabled={simState === 'running'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-primary text-on-primary px-space-lg py-3 rounded-full font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
                  id="sim-trigger-btn"
                >
                  <span className="material-symbols-outlined text-[20px]">touch_app</span>
                  <span>
                    {simState === 'idle'
                      ? 'Run Millisecond Claim Race'
                      : simState === 'running'
                      ? 'Race in progress...'
                      : 'Race Completed'}
                  </span>
                </button>
                <button
                  onClick={resetSim}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-surface-container-highest text-on-surface px-space-md py-3 rounded-full font-label-lg text-label-lg hover:bg-surface-variant transition-all"
                  id="sim-reset-btn"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Simulation Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
              {/* NGO A Column */}
              <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                        A
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Hope Shelter van</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">0.8 miles away</span>
                      </div>
                    </div>
                    <span
                      className={`px-space-sm py-space-xs rounded-full font-label-sm text-label-sm transition-all ${
                        simState === 'completed'
                          ? 'bg-primary text-on-primary font-bold'
                          : simState === 'running'
                          ? 'bg-primary-fixed text-primary font-bold'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {simState === 'completed'
                        ? 'CLAIM LOCKED (1st)'
                        : simState === 'running'
                        ? 'Tapping... (0.012s)'
                        : 'Standby'}
                    </span>
                  </div>

                  {/* Reaching Hand Visual Container */}
                  <div className="relative py-space-md flex flex-col items-center">
                    <div
                      className={`transition-all duration-500 ease-out flex flex-col items-center text-primary ${
                        simState !== 'idle' ? 'translate-y-4 scale-105' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[64px] rotate-90">front_hand</span>
                      <span className="font-label-sm text-label-sm font-semibold mt-1">Volunteer Marcus taps at t=0.00s</span>
                    </div>
                  </div>
                </div>

                {/* Resolution card for A */}
                <div
                  className={`rounded-lg p-space-md transition-all ${
                    simState === 'completed'
                      ? 'bg-primary-fixed/40 border border-primary/20'
                      : 'bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold mb-1">
                    <span className="material-symbols-outlined text-[20px]">
                      {simState === 'completed' ? 'verified' : 'check_circle'}
                    </span>
                    <span>
                      {simState === 'completed'
                        ? 'Batch Claimed! Gate Pass #KT-884 issued'
                        : 'Ready to race'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {simState === 'completed'
                      ? 'Volunteer Marcus receives canteen gate contact & loading bay directions. Insulated cambro pickup confirmed.'
                      : 'Click "Run Millisecond Claim Race" above to simulate NGO A requesting the batch first.'}
                  </p>
                </div>
              </div>

              {/* Central Target: The Food Batch */}
              <div className="lg:col-span-4 bg-surface-container-high rounded-xl p-space-lg flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">Prize Resource</span>
                  <span
                    className={`px-space-sm py-space-xs rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 transition-all ${
                      simState === 'completed'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {simState === 'completed' ? 'lock' : 'lock_open'}
                    </span>
                    {simState === 'completed' ? 'LOCKED for Hope Shelter' : 'Open Batch'}
                  </span>
                </div>

                {/* Plate Illustration */}
                <div className="relative my-space-md flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center">
                    {/* Warm plate illustration SVG */}
                    <svg className="w-28 h-28 text-secondary" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeDasharray="2 4" strokeWidth="4"></circle>
                      <circle cx="50" cy="50" fill="#fee9d6" r="34"></circle>
                      <path d="M36 46C40 38 60 38 64 46" stroke="#904d00" strokeLinecap="round" strokeWidth="3"></path>
                      <path d="M32 54C38 66 62 66 68 54" stroke="#904d00" strokeLinecap="round" strokeWidth="4"></path>
                      <circle cx="50" cy="53" fill="#1e4d2b" r="5"></circle>
                      <circle cx="43" cy="58" fill="#fe932c" r="4"></circle>
                      <circle cx="57" cy="58" fill="#7f2400" r="4"></circle>
                      {/* Steam lines */}
                      <path d="M42 30C42 24 46 22 46 16" stroke="#fe932c" strokeLinecap="round" strokeWidth="2"></path>
                      <path d="M50 32C50 25 54 23 54 18" stroke="#fe932c" strokeLinecap="round" strokeWidth="2"></path>
                      <path d="M58 30C58 24 62 22 62 16" stroke="#fe932c" strokeLinecap="round" strokeWidth="2"></path>
                    </svg>

                    {/* Atomic Lock Stamp */}
                    <div
                      className={`absolute inset-0 bg-primary/95 text-on-primary rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                        simState === 'completed' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[40px]">lock</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Claim Locked</span>
                      <span className="font-label-sm text-label-sm text-on-primary-container">at 0.012 sec</span>
                    </div>
                  </div>

                  <div className="mt-space-sm">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">35 Steamed Veg &amp; Brown Rice Bowls</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Central City Canteen #12 • 1.5h freshness timer</p>
                  </div>
                </div>

                <div className="w-full bg-surface-container-lowest rounded-lg p-space-sm flex items-center justify-around font-label-sm text-label-sm text-on-surface">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    Single-Token Gate
                  </span>
                  <span className="text-on-surface-variant">Zero Collision</span>
                </div>
              </div>

              {/* NGO B Column */}
              <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold">
                        B
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Northside Soup Pantry</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">1.4 miles away</span>
                      </div>
                    </div>
                    <span
                      className={`px-space-sm py-space-xs rounded-full font-label-sm text-label-sm transition-all ${
                        simState === 'completed'
                          ? 'bg-surface-container-highest text-on-surface font-bold'
                          : simState === 'running'
                          ? 'bg-secondary-fixed text-secondary font-bold'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {simState === 'completed'
                        ? 'DEFLECTED (+0.081s)'
                        : simState === 'running'
                        ? 'Tapping... (+0.081s)'
                        : 'Standby'}
                    </span>
                  </div>

                  {/* Reaching Hand Visual Container */}
                  <div className="relative py-space-md flex flex-col items-center">
                    <div
                      className={`transition-all duration-500 ease-out flex flex-col items-center text-secondary ${
                        simState === 'running' ? 'translate-y-4 scale-105' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[64px] -rotate-90">front_hand</span>
                      <span className="font-label-sm text-label-sm font-semibold mt-1">Volunteer Sarah taps at t=+0.08s</span>
                    </div>
                  </div>
                </div>

                {/* Resolution card for B */}
                <div className="bg-surface-container rounded-lg p-space-md transition-all">
                  <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-bold mb-1">
                    <span className="material-symbols-outlined text-[20px]">
                      {simState === 'completed' ? 'near_me' : 'timer'}
                    </span>
                    <span>
                      {simState === 'completed' ? 'Already claimed! Redirected smoothly' : 'Queued in queue'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {simState === 'completed' ? (
                      <>
                        Zero duplicate trip! Sarah's app instantly suggests:{' '}
                        <strong>"20 Fresh Baguettes at Artisan Crust (0.3 mi)"</strong> or{' '}
                        <strong>"40 Lentil Bowls at East Cafe (0.9 mi)"</strong>.
                      </>
                    ) : (
                      'Will arrive only milliseconds later. Watch how the interface deflects smoothly without sending them on a wasted drive.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* System Architecture Takeaways */}
            <div className="mt-space-lg pt-space-md grid grid-cols-1 sm:grid-cols-3 gap-space-md text-on-surface">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">Zero Double Pickups</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Once the digital lock drops, donor security only authorizes the confirmed volunteer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">local_gas_station</span>
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">Zero Wasted Fuel</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Volunteers never leave their garage unless an exclusive reservation is locked.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">turn_slight_right</span>
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">Graceful Re-routing</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Runner-up NGOs are auto-suggested 2 other nearby available meals within seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAIN-LANGUAGE FAQ ACCORDION ── */}
      <section className="w-full py-space-xl bg-surface-container-low">
        <div className="max-w-[880px] mx-auto px-margin">
          <div className="text-center mb-space-xl">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Common Questions</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xs">
              Clear answers for canteens &amp; shelters
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
              Everything you need to know about food safety guidelines, platform fees, and logistics.
            </p>
          </div>

          <div className="flex flex-col gap-space-md" id="faq-accordion">
            {/* Question 1 */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full px-space-lg py-space-md flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFaq(1)}
              >
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">1</span>
                  What kind of food can be donated on Kind Table?
                </span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openFaqs[1] ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaqs[1] && (
                <div className="px-space-lg pb-space-lg pt-0 animate-slide-down">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    We rescue wholesome, safe, surplus food from regulated kitchens:
                  </p>
                  <ul className="mt-space-xs space-y-space-xs font-body-sm text-body-sm text-on-surface">
                    <li className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_small</span>
                      <strong>Cooked canteen meals:</strong> Chafing dish trays that remained heated or were blast-chilled immediately after lunch/dinner service.
                    </li>
                    <li className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_small</span>
                      <strong>Bakery items:</strong> Day-of baked bread, baguettes, buns, and un-creamed pastries.
                    </li>
                    <li className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_small</span>
                      <strong>Fresh produce:</strong> Whole crates of fruits and vegetables from farmers or market distributors.
                    </li>
                    <li className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_small</span>
                      <strong>Packaged &amp; Dairy:</strong> Unopened yogurt, milk, and pantry staples within their legal consume-by date.
                    </li>
                  </ul>
                  <p className="font-label-sm text-label-sm text-tertiary mt-space-sm bg-tertiary-fixed/30 p-space-xs rounded">
                    * Note: We strictly reject previously half-eaten table plates, expired meats, or unlabelled homemade jars.
                  </p>
                </div>
              )}
            </div>

            {/* Question 2 */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full px-space-lg py-space-md flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFaq(2)}
              >
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">2</span>
                  How do we know the food is completely safe?
                </span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openFaqs[2] ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaqs[2] && (
                <div className="px-space-lg pb-space-lg pt-0 animate-slide-down">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Every donation requires a mandatory <strong>Safe Expiration Timer</strong> logged directly by the head chef or catering manager. In addition:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-space-sm">
                    <div className="bg-surface-container p-space-sm rounded-lg">
                      <span className="font-label-md text-label-md text-primary font-bold">2-Hour Temperature Rule</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Cooked foods must maintain &gt;63°C (hot holding) or &lt;5°C (refrigerated) until volunteer pickup.
                      </p>
                    </div>
                    <div className="bg-surface-container p-space-sm rounded-lg">
                      <span className="font-label-md text-label-md text-secondary font-bold">Insulated Handoff</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Certified rescue couriers carry thermal food transport cambros to maintain safe dining compliance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Question 3 */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full px-space-lg py-space-md flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFaq(3)}
              >
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">3</span>
                  Is Kind Table free for NGOs, shelters, and donors?
                </span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openFaqs[3] ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaqs[3] && (
                <div className="px-space-lg pb-space-lg pt-0 animate-slide-down">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    <strong>Yes, 100% free.</strong> Kind Table is managed as an open civic utility dedicated to UN Sustainable Development Goal 2: Zero Hunger.
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                    There are no transaction cuts, no monthly SaaS tiers, and no volunteer fees. Operations are backed by philanthropic micro-grants and partner municipal sustainability funds.
                  </p>
                </div>
              )}
            </div>

            {/* Question 4 */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full px-space-lg py-space-md flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFaq(4)}
              >
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">4</span>
                  What happens if no NGO claims the food in time?
                </span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openFaqs[4] ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaqs[4] && (
                <div className="px-space-lg pb-space-lg pt-0 animate-slide-down">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Our system runs an automated cascading protocol:
                  </p>
                  <div className="flex flex-col gap-space-xs mt-space-xs font-body-sm text-body-sm text-on-surface">
                    <div className="flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">emergency_home</span>
                      <div>
                        <strong>At 60 minutes remaining:</strong> The broadcast perimeter auto-expands from 3 miles to 7 miles, inviting regional refrigerated vans.
                      </div>
                    </div>
                    <div className="flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0">compost</span>
                      <div>
                        <strong>At expiration zero:</strong> The batch strictly auto-retires from the feed to prevent unsafe collections, and offers the canteen a 1-tap connection to local municipal bio-composting partners.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CALL TO ACTION: CHOOSE YOUR PATH ── */}
      <section className="w-full py-space-xl bg-surface">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="bg-primary text-on-primary rounded-xl p-space-lg sm:p-space-xl shadow-md relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary opacity-20 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 max-w-3xl mb-space-xl">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed">Get Involved Today</span>
              <h2 className="font-display-lg text-display-lg text-white mt-space-xs">
                Ready to share or rescue food in your neighborhood?
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary-container mt-space-xs">
                Join 340+ canteens, bakeries, soup kitchens, and neighborhood shelters across the city network. Setup takes under 3 minutes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg relative z-10">
              {/* Donor Path */}
              <div className="bg-surface-container-lowest text-on-surface rounded-xl p-space-lg flex flex-col justify-between shadow-sm">
                <div>
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[26px]">restaurant</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                    I Manage a Canteen, Kitchen, or Bakery
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                    Put your daily surplus to honorable use. Gain automated tax receipts and monthly food diversion metrics for your company's ESG reports.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => onNavigate('donor')}
                    className="w-full inline-flex items-center justify-center gap-space-xs bg-secondary text-on-secondary px-space-lg py-3 rounded-full font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-all"
                  >
                    <span>Start Donating Leftovers</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* NGO Path */}
              <div className="bg-surface-container-lowest text-on-surface rounded-xl p-space-lg flex flex-col justify-between shadow-sm">
                <div>
                  <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[26px]">volunteer_activism</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                    I Run a Shelter, Pantry, or NGO
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                    Receive instant geo-located alerts when warm nutritious trays are ready nearby. Lock portions instantly without awkward double runs.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => onNavigate('ngo')}
                    className="w-full inline-flex items-center justify-center gap-space-xs bg-primary text-on-primary px-space-lg py-3 rounded-full font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-all"
                  >
                    <span>Register Your Shelter</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-md flex flex-wrap items-center justify-between gap-space-sm text-on-primary-container font-label-sm text-label-sm">
              <span>Need a demo for municipal councils or institutional canteens?</span>
              <button
                onClick={() => onNavigate('admin')}
                className="text-white hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request an On-Site Kitchen Onboarding</span>
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
