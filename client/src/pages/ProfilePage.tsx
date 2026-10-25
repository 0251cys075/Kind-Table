import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlacePicker } from '../components/PlacePicker';

interface ProfilePageProps {
  onNavigate: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout, updateProfile, loading } = useAuth();

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setOrganization(user.organization || '');
      setPhone(user.phone || '');
      setDefaultLocation(user.defaultLocation || '');
      setLatitude(user.latitude);
      setLongitude(user.longitude);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 mb-4">
            <span className="material-symbols-outlined text-[32px]">account_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to view your profile</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            Log in to manage your default pickup addresses, track rescued portions, and update contact settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await updateProfile({
      name: name.trim(),
      organization: organization.trim(),
      phone: phone.trim(),
      defaultLocation: defaultLocation.trim(),
      latitude,
      longitude,
    });
    if (res.success) {
      setMessage({ text: 'Your profile has been saved successfully.', type: 'success' });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col w-full py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                user.role === 'donor'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : user.role === 'ngo'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-purple-100 text-purple-900 border-purple-300'
              }`}
            >
              {user.role === 'donor' ? 'Food Donor' : user.role === 'ngo' ? 'NGO Partner' : 'Admin Control'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Log Out
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Account & Location Settings</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Keep your dispatch contact info and default pickup address updated so volunteers navigate accurately.
          </p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="profile-name">
                  Contact Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="profile-org">
                  Organisation Name
                </label>
                <input
                  id="profile-org"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="profile-phone">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full h-12 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Default Pickup / Delivery Dock Address
              </label>
              <PlacePicker
                value={defaultLocation}
                onChange={(val) => setDefaultLocation(val)}
                onSelectCoords={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                placeholder="Street address, kitchen service door, room..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Coordinates:{' '}
                <span className="font-mono text-emerald-800 font-semibold">
                  {latitude ?? 40.7128}, {longitude ?? -74.006}
                </span>
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
