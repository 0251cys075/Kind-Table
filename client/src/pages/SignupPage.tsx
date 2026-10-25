import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlacePicker } from '../components/PlacePicker';

interface SignupPageProps {
  onNavigate: (tab: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { signup, loading } = useAuth();
  const [role, setRole] = useState<'donor' | 'ngo'>('donor');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }

    const res = await signup({
      role,
      name: name.trim(),
      organization: organization.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      defaultLocation: defaultLocation.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onNavigate(role === 'donor' ? 'donor' : 'ngo');
      }, 800);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-800 text-white shadow-md mb-4">
            <span className="material-symbols-outlined text-[28px]">person_add</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Join the Food Rescue Mission
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Create a Kind Table account to connect surplus food with local communities in need.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('donor')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'donor'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-700'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="material-symbols-outlined text-[20px] text-emerald-800">
                      bakery_dining
                    </span>
                    <span>Food Donor</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Canteen, cafe, kitchen, bakery</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ngo')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'ngo'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-700'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="material-symbols-outlined text-[20px] text-emerald-800">
                      volunteer_activism
                    </span>
                    <span>NGO Hub</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Shelter, food bank, charity</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="signup-name">
                Your name / Contact person
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="signup-org">
                Organisation name
              </label>
              <input
                id="signup-org"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Hope Shelter Network or Sunrise Bakery"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="signup-email">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@org.org"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="signup-phone">
                  Phone
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Default location / Pickup dock
              </label>
              <PlacePicker
                value={defaultLocation}
                onChange={(val) => setDefaultLocation(val)}
                onSelectCoords={(lat, lng) => setCoords({ lat, lng })}
                placeholder="Choose standard location or type street address..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};
