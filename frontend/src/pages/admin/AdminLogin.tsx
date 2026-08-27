/**
 * @file pages/admin/AdminLogin.tsx
 * @description Admin login page at /admin/login.
 * Calls POST /api/admin/login via AdminAuthContext.adminSignIn().
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminSignIn } = useAdminAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await adminSignIn(email, password);

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    navigate('/admin');
  }

  return (
    <div className="min-h-screen bg-[#1C1008] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#C4A265] flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-[#3D2B0E]" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-white/50 text-sm mt-1">The Dorm Store</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                Admin Email
              </label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#C4A265]/60">
                <Mail size={15} className="text-white/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@dormstore.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#C4A265]/60">
                <Lock size={15} className="text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C4A265] hover:bg-[#D4B275] text-[#3D2B0E] font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Restricted access · The Dorm Store Admin
        </p>
      </div>
    </div>
  );
}
