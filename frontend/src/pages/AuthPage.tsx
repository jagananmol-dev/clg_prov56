import { useState, FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'signup';
type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

/** How many failed logins before lockout */
const MAX_ATTEMPTS    = 5;
/** Seconds to lock the form after MAX_ATTEMPTS failures */
const LOCKOUT_SECONDS = 30;

// ─────────────────────────────────────────────
// Password strength scoring
// ─────────────────────────────────────────────
function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  let score = 0;
  if (password.length >= 8)           score++; // minimum length
  if (password.length >= 12)          score++; // better length
  if (/[A-Z]/.test(password))         score++; // uppercase letter
  if (/[0-9]/.test(password))         score++; // digit
  if (/[^A-Za-z0-9]/.test(password)) score++; // special character
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; width: string; textColor: string }> = {
  empty:  { label: '',       color: 'bg-[#E8DDD0]',  width: 'w-0',    textColor: '' },
  weak:   { label: 'Weak',   color: 'bg-red-400',    width: 'w-1/4',  textColor: 'text-red-500' },
  fair:   { label: 'Fair',   color: 'bg-orange-400', width: 'w-2/4',  textColor: 'text-orange-500' },
  good:   { label: 'Good',   color: 'bg-[#C4A265]',  width: 'w-3/4',  textColor: 'text-[#C4A265]' },
  strong: { label: 'Strong', color: 'bg-green-500',  width: 'w-full', textColor: 'text-green-600' },
};

// ─────────────────────────────────────────────
// Error message sanitiser — prevents information leakage
// Maps specific Supabase error strings → safe generic messages
// ─────────────────────────────────────────────
function sanitizeError(raw: string, isSignup: boolean): string {
  const msg = raw.toLowerCase();

  // Email enumeration: never confirm whether an email exists
  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('user not found') ||
    msg.includes('email not confirmed') ||
    msg.includes('no user found')
  ) {
    return 'Invalid email or password. Please check your details and try again.';
  }

  // Don't leak "email already registered" on login page
  if (msg.includes('email already') || msg.includes('already registered') || msg.includes('user already')) {
    return isSignup
      ? 'An account with this email already exists. Try logging in.'
      : 'Invalid email or password. Please check your details and try again.';
  }

  if (msg.includes('password')) {
    return 'Password does not meet the requirements. Please choose a stronger password.';
  }

  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts from this device. Please wait a moment and try again.';
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  // Brute-force rate limiting
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Forgot-password sub-flow
  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]     = useState(false);

  const isSignup  = mode === 'signup';
  const isLocked  = lockoutSeconds > 0;
  const strength  = getPasswordStrength(password);
  const sc        = STRENGTH_CONFIG[strength];

  // Reset volatile state when mode changes (login ↔ signup)
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setFailedAttempts(0);
    setLockoutSeconds(0);
    if (lockoutTimer.current) clearInterval(lockoutTimer.current);
  }, [mode]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (lockoutTimer.current) clearInterval(lockoutTimer.current);
    };
  }, []);

  function startLockout() {
    setLockoutSeconds(LOCKOUT_SECONDS);
    lockoutTimer.current = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(lockoutTimer.current!);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Signup submit ─────────────────────────────
  async function handleSignupSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (strength === 'weak' || strength === 'empty') {
      setError('Password is too weak. Use at least 8 characters with a mix of uppercase, numbers, and symbols.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signupErr } = await signUp(email, password, name, phone);
      if (signupErr) throw signupErr;
      setSuccessMsg('Account created! Please check your inbox to confirm your email before logging in.');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      setError(sanitizeError(raw, true));
    } finally {
      setLoading(false);
    }
  }

  // ── Login submit ───────────────────────────────────
  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLocked) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error: err } = await signIn(email, password);
      if (err) throw err;
      navigate('/');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      setError(sanitizeError(raw, false));

      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= MAX_ATTEMPTS) startLockout();
    } finally {
      setLoading(false);
    }
  }

  // Forgot-password always reports success to prevent email enumeration
  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    await resetPassword(forgotEmail);
    setForgotLoading(false);
    setForgotSent(true); // show success regardless of whether email exists
  }

  // ─────────────────────────────────────────────
  // Forgot password overlay
  // ─────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8DDD0] p-8 shadow-sm">
          <Link to="/" className="font-display text-xl text-[#3D2B0E]">The Dorm Store</Link>

          <h1 className="mt-6 font-display text-2xl text-[#1C1C1C]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#5A5A5A]">
            Enter your email and we'll send a reset link if an account exists.
          </p>

          {forgotSent ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent.
              </span>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
              <Field
                label="Email address"
                icon={<Mail className="h-4 w-4" />}
                input={
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#8A8A8A] focus:outline-none"
                  />
                }
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-full bg-[#3D2B0E] px-6 py-3.5 text-sm font-medium text-white hover:bg-[#5A3F1A] disabled:opacity-60"
              >
                {forgotLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <button
            onClick={() => { setShowForgot(false); setForgotSent(false); }}
            className="mt-5 text-sm text-[#7C5A2A] hover:underline"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Main login / signup form
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Left — decorative image panel */}
      <div className="relative hidden lg:block">
        <img
          src="https://images.pexels.com/photos/7657379/pexels-photo-7657379.jpeg?auto=compress&cs=tinysrgb&h=1200&w=900"
          alt="Stationery flat lay"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B0E]/70 via-[#3D2B0E]/20 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-[#E8DDD0]">The Dorm Store</p>
          <h2 className="mt-4 font-display text-4xl leading-tight">
            Where every page<br />tells your story.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Thoughtfully crafted stationery for students who still believe a handwritten note is worth a thousand texts.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          <Link to="/" className="font-display text-2xl text-[#3D2B0E]">The Dorm Store</Link>

          <h1 className="mt-8 font-display text-3xl text-[#1C1C1C]">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-[#5A5A5A]">
            {isSignup ? 'Join us and start your stationery journey.' : 'Log in to continue to your account.'}
          </p>

          {/* Success banner */}
          {successMsg && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lockout banner */}
          {isLocked && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Too many failed attempts. Please wait <strong>{lockoutSeconds}s</strong> before trying again.</span>
            </div>
          )}

          {/* Attempts remaining warning */}
          {!isSignup && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && !isLocked && (
            <p className="mt-3 text-xs text-amber-600">
              {MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
            </p>
          )}

          {/* Form — hidden after successful signup (user must check email) */}
          {!successMsg && (
            <form onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit} className="mt-6 space-y-5">

              {isSignup && (
                <Field
                  label="Full Name"
                  icon={<User className="h-4 w-4" />}
                  input={
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      className="w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#8A8A8A] focus:outline-none"
                    />
                  }
                />
              )}

              <Field
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                input={
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#8A8A8A] focus:outline-none"
                  />
                }
              />

              {/* Phone — captured at signup so it's already on file before any order,
                  instead of being asked for again (and only stored per-order) at checkout. */}
              {isSignup && (
                <div>
                  <Field
                    label="Phone Number"
                    icon={<Phone className="h-4 w-4" />}
                    input={
                      <div className="flex w-full items-center">
                        <span className="text-sm font-medium text-[#5A5A5A] mr-2 select-none">+91</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          maxLength={10}
                          autoComplete="tel-national"
                          className="w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#8A8A8A] focus:outline-none"
                        />
                      </div>
                    }
                  />
                  {phone.length > 0 && !/^[6-9]\d{9}$/.test(phone) && (
                    <p className="mt-1.5 px-1 text-xs text-red-500">Enter a valid 10-digit Indian mobile number</p>
                  )}
                </div>
              )}

              {/* Password field + strength meter */}
              <div className="space-y-2">
                <Field
                  label="Password"
                  icon={<Lock className="h-4 w-4" />}
                  input={
                    <div className="flex w-full items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={isSignup ? 8 : 1}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        className="w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#8A8A8A] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="text-[#8A8A8A] hover:text-[#5A5A5A]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  }
                />

                {/* Password strength meter — only shown during signup */}
                {isSignup && password.length > 0 && (
                  <div className="space-y-1 px-1">
                    <div className="h-1 w-full rounded-full bg-[#E8DDD0] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${sc.color} ${sc.width}`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-medium ${sc.textColor}`}>{sc.label}</p>
                      {strength === 'weak' && (
                        <p className="text-xs text-[#8A8A8A]">Add uppercase, numbers & symbols</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Forgot password link */}
              {!isSignup && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                    className="text-xs text-[#5A5A5A] hover:text-[#3D2B0E]"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  isLocked ||
                  (isSignup && (strength === 'weak' || strength === 'empty'))
                }
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#3D2B0E] px-6 py-3.5 text-sm font-medium text-white hover:bg-[#5A3F1A] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
              >
                {loading
                  ? 'Please wait…'
                  : isLocked
                  ? `Try again in ${lockoutSeconds}s`
                  : isSignup
                  ? 'Create Account'
                  : 'Log in'}
                {!loading && !isLocked && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#5A5A5A]">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={isSignup ? '/login' : '/signup'}
              className="font-medium text-[#3D2B0E] underline-offset-2 hover:underline"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared form field component
// ─────────────────────────────────────────────
function Field({
  label,
  icon,
  input,
}: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5A5A5A]">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-[#E8DDD0] bg-white px-4 py-3 focus-within:border-[#C4A265] focus-within:ring-2 focus-within:ring-[#C4A265]/20 transition-all">
        <span className="text-[#8A8A8A]">{icon}</span>
        {input}
      </div>
    </div>
  );
}
