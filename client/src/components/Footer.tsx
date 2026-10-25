import React from 'react';

export const Footer: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-100 border-t border-slate-200 pt-12 pb-8 text-slate-600">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
              </div>
              <span className="text-xl font-bold text-emerald-950">Kind Table</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Connecting neighborhood canteens, bakeries, and kitchens with volunteers and local shelters before good food goes to waste.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Community</span>
              <button
                type="button"
                onClick={() => onNavigate('donor')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Donors &amp; Canteens
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ngo')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                NGOs &amp; Pantries
              </button>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Safety Guidelines
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Platform</span>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Control Dispatch
              </button>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Impact Stats
              </button>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Support Center
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Account</span>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onNavigate('donor')}
                className="text-left text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Join Network
              </button>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2024 Kind Table Initiative. Good food, shared in time.</span>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate('how-it-works')} className="hover:text-slate-900 cursor-pointer">
              Food Rescue Charter
            </button>
            <button type="button" onClick={() => onNavigate('how-it-works')} className="hover:text-slate-900 cursor-pointer">
              Privacy
            </button>
            <button type="button" onClick={() => onNavigate('how-it-works')} className="hover:text-slate-900 cursor-pointer">
              Transparency
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
