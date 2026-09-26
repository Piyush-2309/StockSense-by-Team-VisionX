import React, { useState } from 'react';
<<<<<<< HEAD
import { ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2, RotateCcw, Loader2, User } from 'lucide-react';
import { RouteId } from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../services/apiClient';
=======
import { ShieldCheck, Mail, Lock, ArrowRight, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../services/backendApi';
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54

interface AuthViewProps {
  // No longer needs onLoginSuccess — AuthContext drives the gate
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'otp';

export const AuthView: React.FC<AuthViewProps> = () => {
  const { showToast } = useToast();
<<<<<<< HEAD
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
=======
  const { login } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('manager@stocksense.com');
  const [password, setPassword] = useState('Password123');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillDemoAccount = (role: 'manager' | 'staff') => {
    if (role === 'manager') {
      setEmail('manager@stocksense.com');
      setPassword('Password123');
    } else {
      setEmail('staff@stocksense.com');
      setPassword('Password123');
    }
    setErrorMessage(null);
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    showToast('info', 'OTP', 'OTP verification is handled server-side via /api/v1/auth/verify-otp.');
=======
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(email, password);
      showToast('success', 'Authentication Successful', `Welcome back, ${user.name}!`);
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
      showToast('error', 'Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await backendApi.auth.signup({ name, email, password });
      showToast('success', 'Account Created', 'Registration successful. Signing you in...');
      const user = await login(email, password);
      showToast('success', 'Welcome to StockSense', `Logged in as ${user.name}`);
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || 'Signup failed. Please verify your details.';
      setErrorMessage(msg);
      showToast('error', 'Signup Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await backendApi.auth.forgotPassword(email);
      showToast('info', 'OTP Dispatched', 'A 6-digit verification code has been generated.');
      setMode('otp');
    } catch (err: any) {
      const msg = err.message || 'Unable to request password reset.';
      setErrorMessage(msg);
      showToast('error', 'Reset Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const otpCode = otp.join('');
    try {
      await backendApi.auth.resetPassword({
        email,
        otp: otpCode,
        newPassword: newPassword || 'Password123',
      });
      showToast('success', 'Password Reset', 'Your password has been updated. Please sign in.');
      setPassword(newPassword || 'Password123');
      setMode('login');
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      showToast('error', 'Verification Failed', msg);
    } finally {
      setIsLoading(false);
    }
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
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
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(124, 58, 237, 0.25)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              color: '#DDD6FE',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Connected Spring Boot + React ERP
          </span>
          <h1
            style={{
              fontSize: 38,
              lineHeight: 1.2,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Real-Time Command Center For Modern Warehouses.
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
            Eliminate manual registers and disconnected Excel sheets. Authoritative double-entry ledger,
            atomic database transactions, and automated replenishment.
          </p>

          {/* Quick Demo Fill Buttons */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Demo Accounts:
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => fillDemoAccount('manager')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>👔 Manager (All Access)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('staff')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📦 Warehouse Staff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Feature Highlights */}
        <div style={{ display: 'flex', gap: 24, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#CBD5E1' }}>
            <CheckCircle2 size={16} color="#A78BFA" />
            <span>PostgreSQL & Spring Boot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#CBD5E1' }}>
            <CheckCircle2 size={16} color="#A78BFA" />
            <span>Immutable Stock Moves</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#CBD5E1' }}>
            <CheckCircle2 size={16} color="#A78BFA" />
            <span>Zero Negative Stock</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div
        style={{
          flex: 0.9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
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
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

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
                  <label className="input-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="email"
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

<<<<<<< HEAD
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                  <input type="checkbox" id="remember" defaultChecked style={{ accentColor: '#6D28D9' }} />
                  <label htmlFor="remember" style={{ cursor: 'pointer' }}>Remember me on this browser</label>
                </div>

                {formError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                    {formError}
                  </div>
                )}

=======
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9', marginTop: 6, opacity: isSubmitting ? 0.7 : 1 }}
                  disabled={isSubmitting}
                >
<<<<<<< HEAD
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
=======
                  <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </button>
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                Don't have an account?{' '}
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('signup');
                  }}
                  style={{ color: '#6D28D9', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign Up
                </span>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, color: '#0F172A' }}>Create Account</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 6 }}>
                  Join your team on StockSense
                </p>
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="input-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Alex Morgan"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Password</label>
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9', marginTop: 6 }}
                >
                  <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                Already registered?{' '}
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  style={{ color: '#6D28D9', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back to Sign In
                </span>
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, color: '#0F172A' }}>Password Reset</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 6 }}>
                  Enter your email to receive an authentication OTP
                </p>
              </div>

              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="input-label">Registered Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9', marginTop: 6 }}
                >
                  <span>{isLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  style={{ color: '#6D28D9', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back to Sign In
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
                <h2 style={{ fontSize: 22, color: '#0F172A' }}>Enter 6-Digit OTP</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Enter the verification code and your new password
                </p>
              </div>

              <form onSubmit={handleResetWithOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

                <div>
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ background: '#6D28D9', marginTop: 6 }}
                >
                  <span>{isLoading ? 'Resetting...' : 'Verify OTP & Reset Password'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  style={{ color: '#6D28D9', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back to Sign In
                </span>
              </div>
<<<<<<< HEAD

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
=======
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
