import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (role: 'admin' | 'editor', email: string) => void;
  onBack: () => void;
}

// Demo-level admin credentials. NOTE: this repo is public, so these values are
// visible in the built JS. For real security, switch to Supabase Auth later.
// Override via Railway/Vercel env: VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD.
const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'admin@jobpulse.com';
const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('admin@jobpulse.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError('Invalid email or password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(role, email.trim().toLowerCase());
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto py-16 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-medium text-slate-900">Admin CMS Portal</h1>
          <p className="text-xs text-slate-500">Secure access for authorized administrators and editors only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Role Privilege</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'editor')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none cursor-pointer"
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="editor">Content Editor (Manage Jobs & Review)</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 mt-4"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to CMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
            ← Return to Job Board
          </button>
        </div>

      </div>
    </div>
  );
};
