import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type AuthStep = 'email' | 'otp';

type LoginFormProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  onSuccess?: () => void;
};

export default function LoginForm({
  eyebrow = 'Slumber',
  title = 'Sign in',
  description = 'Use the email tied to your Slumber account. We will send a one-time code.',
  onSuccess,
}: LoginFormProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setAuthStep('otp');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Could not send code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      if (error) throw error;
      onSuccess?.();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="admin-card admin-card-narrow login-card">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead admin-lead">{description}</p>

      {authStep === 'email' ? (
        <form className="admin-form" onSubmit={handleSendOtp}>
          <label className="admin-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="admin-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
          {authError && <p className="admin-error">{authError}</p>}
          <button className="admin-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form className="admin-form" onSubmit={handleVerifyOtp}>
          <p className="admin-muted">Code sent to {email}</p>
          <label className="admin-label" htmlFor="login-otp">Verification code</label>
          <input
            id="login-otp"
            className="admin-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(ev) => setOtp(ev.target.value)}
            required
          />
          {authError && <p className="admin-error">{authError}</p>}
          <button className="admin-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Verifying…' : 'Sign in'}
          </button>
          <button
            className="admin-button admin-button-ghost"
            type="button"
            onClick={() => { setAuthStep('email'); setOtp(''); setAuthError(null); }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
