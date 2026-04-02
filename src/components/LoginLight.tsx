import { useState, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { API_URL } from '../config';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const CONNECTION_ERROR_TEXT = `Connection to the server failed. Check whether the backend is running (${API_URL}).`;

interface LoginLightProps {
  onLoginSuccess: (user: { id: string; email: string; name: string }, token: string) => void;
}

function LoginForm({ onLoginSuccess }: LoginLightProps) {
  const [mode, setMode] = useState<'main' | 'email' | 'code'>('main');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const getFriendlyErrorMessage = (err: unknown, fallback: string) => {
    const e = err as Error | undefined;
    const message = e?.message || '';
    if (e instanceof TypeError || /failed to fetch|network|load failed/i.test(message)) {
      return CONNECTION_ERROR_TEXT;
    }
    return message || fallback;
  };

  // Google login handler
  const handleGoogleSuccess = useCallback(async (response: CredentialResponse) => {
    if (!response.credential) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth.google', credential: response.credential }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Google sign-in failed');

      localStorage.setItem('session_token', data.token);
      localStorage.setItem('session_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Google sign-in failed'));
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess]);

  // Magic link: request code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth.request_code', email }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Could not send code');

      if (data._dev_code) setCode(data._dev_code);
      setMode('code');
      setCountdown(600);
      const interval = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  // Magic link: verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth.verify_code', email, code }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Invalid code');

      localStorage.setItem('session_token', data.token);
      localStorage.setItem('session_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">InvoiceSnap</h1>
          <p className="text-gray-600">Create invoices in 60 seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign in</h2>

          {/* Main view: Google + Email option */}
          {mode === 'main' && (
            <div className="space-y-6">
              {/* Google Login */}
              {GOOGLE_CLIENT_ID && (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed')}
                    text="signin_with"
                    shape="rectangular"
                    size="large"
                    width="350"
                  />
                </div>
              )}

              {GOOGLE_CLIENT_ID && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or with email</span>
                  </div>
                </div>
              )}

              {/* Email option */}
              <button
                onClick={() => setMode('email')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign in with email
              </button>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Email step */}
          {mode === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.co.uk"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send sign-in code'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('main'); setError(''); }}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
              >
                Back
              </button>
              <div className="text-center text-sm text-gray-600">
                <p>We will send a 6-digit code to your email</p>
              </div>
            </form>
          )}

          {/* Code step */}
          {mode === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter code
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Sent to <span className="font-semibold">{email}</span>
                </p>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-2xl text-center tracking-widest font-mono"
                  disabled={loading}
                  autoFocus
                />
                {countdown > 0 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Code expires in {formatTime(countdown)}
                  </p>
                )}
              </div>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setCode(''); setError(''); }}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
              >
                Back to email
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Secure passwordless sign-in</p>
          <p className="mt-1">E-invoicing ready | VAT compliant</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginLight({ onLoginSuccess }: LoginLightProps) {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </GoogleOAuthProvider>
    );
  }
  return <LoginForm onLoginSuccess={onLoginSuccess} />;
}
