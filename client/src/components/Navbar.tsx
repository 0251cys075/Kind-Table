import React, { useState } from 'react';
import { useLiveAlerts } from '../context/LiveAlertsContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`${className} rounded-full bg-emerald-800 flex items-center justify-center text-white transition-transform group-hover:scale-105 shrink-0 shadow-sm`}>
      <span className="material-symbols-outlined text-[22px]">volunteer_activism</span>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { availableBatches } = useLiveAlerts();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalPortionsAvailable = availableBatches.reduce((acc, b) => acc + b.quantity, 0);
  const mealsSavedToday = totalPortionsAvailable + 280;

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'donor', label: 'Share food (Donor)' },
    { id: 'ngo', label: 'Find food (NGO)' },
    { id: 'admin', label: 'Control room (Admin)' },
    { id: 'how-it-works', label: 'How it works' },
    { id: user ? 'profile' : 'login', label: user ? 'Profile' : 'Log in' },
  ];

  const handleNav = (tabId: string) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="h-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand & Stats */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
          >
            <Logo />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-emerald-950 tracking-tight">Kind Table</span>
              <span className="text-xs font-semibold text-amber-700 -mt-1 hidden sm:inline">Good food, shared in time</span>
            </div>
          </button>

          <div className="hidden xl:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs text-slate-700 font-semibold">
              {mealsSavedToday} meals saved today
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNav(link.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Action & Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleNav('donor')}
            className="hidden sm:inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            Donate Food
          </button>

          <button
            type="button"
            onClick={() => handleNav(user ? 'profile' : 'login')}
            className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white cursor-pointer hover:bg-emerald-900 transition-colors"
            title={user ? `Logged in as ${user.name}` : 'Log in / Sign up'}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNav(link.id)}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
