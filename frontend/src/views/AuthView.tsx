import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2, RotateCcw, Loader2, User } from 'lucide-react';
import { RouteId } from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../services/apiClient';

interface AuthViewProps {
  // No longer needs onLoginSuccess — AuthContext drives the gate
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'otp';

export const AuthView: React.FC<AuthViewProps> = () => {
  const { showToast } = useToast();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('manager@stocksense.com');
  const [password, setPassword] = useState('Password123');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await login(email, password);
      showToast('success', 'Authentication Successful', `Welcome back!`);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Unable to connect to the server.';
      setFormError(msg);
      showToast('error', 'Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await signup(signupName, signupEmail, signupPassword);
      showToast('success', 'Account Created', 'Your account has been registered. Please sign in.');
      setMode('login');
      setEmail(signupEmail);
      setPassword('');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Unable to connect to the server.';
      setFormError(msg);
      showToast('error', 'Signup Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('info', 'OTP', 'OTP verification is handled server-side via /api/v1/auth/verify-otp.');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#F8F9FC',
      }}
    >
      {/* Left Branding Hero Section */}
      <div
        style={{
          flex: 1.1,
          background: 'linear-gradient(135deg, #181226 0%, #311A54 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Subtle Isometric Grid Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <polygon points="12,3 20,7.5 12,12 4,7.5" fill="#DDD6FE" />
              <polygon points="4,7.5 12,12 12,21 4,16.5" fill="#A78BFA" />
              <polygon points="12,12 20,7.5 20,16.5 12,21" fill="#8B5CF6" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: '#FFFFFF', lineHeight: 1.1 }}>
              StockSense
            </div>
            <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 3 }}>
              Smarter Inventory. Stronger Business.
            </div>
          </div>
        </div>

        {/* Center Tagline */}
        <div style={{ maxWidth: 480, zIndex: 10 }}>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#DDD6FE',
              display: 'inline-block',
              marginBottom: 16,
            }}
          >
            Enterprise Inventory Command Center
          </span>
          <h2 style={{ fontSize: 34, lineHeight: 1.25, color: '#FFFFFF' }}>
            Perpetual visibility. Zero discrepancies.
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: 15, marginTop: 14, lineHeight: 1.6 }}>
            Connect inbound supplier receipts, internal relocations, and customer dispatches with an authoritative,
            double-entry audit ledger.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', gap: 24, zIndex: 10, fontSize: 13, color: '#CBD5E1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>Real-time Quants</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>Audit Ledger</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>Multi-Warehouse</span>
          </div>
        </div>
      </div>

      {/* Right Form Card Section */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 440,
            width: '100%',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {mode === 'login' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, color: '#0F172A' }}>Welcome Back</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 6 }}>
                  Sign in to your StockSense command center
                </p>
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="input-label">Email or Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="input-label" style={{ margin: 0 }}>Password</label>
                    <span
                      onClick={() => setMode('forgot')}
                      style={{ fontSize: 12, color: '#6D28D9', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Forgot password?
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                  <input type="checkbox" id="remember" defaultChecked style={{ accentColor: '#6D28D9' }} />
                  <label htmlFor="remember" style={{ cursor: 'pointer' }}>Remember me on this browser</label>
                </div>

                {formError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9', marginTop: 6, opacity: isSubmitting ? 0.7 : 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <span>Sign In</span>}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>

                <div style={{ background: '#F5F3FF', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6D28D9', marginTop: 4 }}>
                  <strong>Demo:</strong> manager@stocksense.com / Password123  •  staff@stocksense.com / Password123
                </div>

                <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 12, color: '#94A3B8' }}>
                  — OR —
                </div>

                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className="btn btn-outline"
                >
                  Sign in with 6-Digit OTP
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                Don't have an account?{' '}
                <span
                  onClick={() => setMode('signup')}
                  style={{ color: '#6D28D9', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign Up
                </span>
              </div>
            </div>
          )}

          {mode === 'otp' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <ShieldCheck size={28} color="#6D28D9" />
                </div>
                <h2 style={{ fontSize: 22, color: '#0F172A' }}>Reset Password / OTP</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Enter the 6-digit verification code sent to your registered mobile
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 6 OTP Boxes */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[idx] = e.target.value;
                        setOtp(newOtp);
                      }}
                      style={{
                        width: 44,
                        height: 52,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 10,
                        outline: 'none',
                        color: '#6D28D9',
                        background: '#FFFFFF',
                      }}
                    />
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: 12.5, color: '#64748B' }}>
                  OTP expires in <strong style={{ color: '#6D28D9' }}>00:45</strong> •{' '}
                  <span style={{ color: '#6D28D9', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9' }}
                >
                  Verify OTP & Access System
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="btn btn-outline"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, color: '#0F172A' }}>Create Account</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Register a new warehouse operator account
                </p>
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">Full Name</label>
                  <input type="text" required value={signupName} onChange={(e) => setSignupName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Work Email</label>
                  <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="input-field" />
                </div>

                {formError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                    {formError}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" style={{ background: '#6D28D9', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register Account'}
                </button>

                <button type="button" onClick={() => setMode('login')} className="btn btn-outline">
                  Back to Sign In
                </button>
              </form>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, color: '#0F172A' }}>Forgot Password</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Enter your email to receive recovery instructions
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMode('otp');
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label className="input-label">Registered Email</label>
                  <input type="email" required defaultValue="tejas@stocksense.com" className="input-field" />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ background: '#6D28D9' }}>
                  Send Recovery OTP
                </button>

                <button type="button" onClick={() => setMode('login')} className="btn btn-outline">
                  Back to Sign In
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
