import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LiveAlertsProvider } from './context/LiveAlertsContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DonorPage } from './pages/DonorPage';
import { NgoPage } from './pages/NgoPage';
import { AdminPage } from './pages/AdminPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';

export const AppContent: React.FC = () => {
  const allowedTabs = ['home', 'donor', 'ngo', 'admin', 'how-it-works', 'login', 'signup', 'profile'];

  // Sync tab with URL hash (e.g. #donor, #ngo, #admin, #how-it-works, #home, #login, #signup, #profile)
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').replace('/', '');
    if (allowedTabs.includes(hash)) {
      return hash;
    }
    return 'home';
  });

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      if (allowedTabs.includes(hash)) {
        setCurrentTab(hash);
      } else if (!hash) {
        setCurrentTab('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAdmin = currentTab === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {!isAdmin && <Navbar currentTab={currentTab} onNavigate={handleNavigate} />}

      <main className="flex-1">
        {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentTab === 'donor' && <DonorPage onNavigateToNGO={() => handleNavigate('ngo')} />}
        {currentTab === 'ngo' && <NgoPage />}
        {currentTab === 'admin' && <AdminPage onNavigate={handleNavigate} />}
        {currentTab === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {currentTab === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentTab === 'signup' && <SignupPage onNavigate={handleNavigate} />}
        {currentTab === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
      </main>

      {!isAdmin && <Footer onNavigate={handleNavigate} />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <LiveAlertsProvider>
            <AppContent />
          </LiveAlertsProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
