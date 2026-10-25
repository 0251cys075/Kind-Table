import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, demoLogin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onNavigate('home');
      }, 700);
    } else {
      setError(res.message);
    }
  };

  const handleDemo = async (role: 'donor' | 'ngo' | 'admin') => {
    setError(null);
    await demoLogin(role);
    onNavigate(role === 'donor' ? 'donor' : role === 'ngo' ? 'ngo' : 'admin');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-800 text-white shadow-md mb-4">
            <span className="material-symbols-outlined text-[28px]">lock_open</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Kind Table
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Sign in to share surplus food, claim batches, or coordinate logistics.
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
            <div>
              <label
                className="block text-sm font-bold text-slate-900 mb-1"
                htmlFor="login-email"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organisation.org"
                  className="w-full h-12 px-4 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-slate-400">
                  mail
                </span>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-bold text-slate-900 mb-1"
                htmlFor="login-password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all text-sm sm:text-base"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-slate-400">
                  key
                </span>
              </div>
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
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              Fast Demo Accounts (1-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('donor')}
                className="px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 text-xs font-bold transition-all text-center cursor-pointer"
              >
                <span className="block text-base mb-0.5">🥐</span>
                Donor
              </button>
              <button
                type="button"
                onClick={() => handleDemo('ngo')}
                className="px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 text-xs font-bold transition-all text-center cursor-pointer"
              >
                <span className="block text-base mb-0.5">🤝</span>
                NGO Hub
              </button>
              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 text-xs font-bold transition-all text-center cursor-pointer"
              >
                <span className="block text-base mb-0.5">⚡</span>
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};
