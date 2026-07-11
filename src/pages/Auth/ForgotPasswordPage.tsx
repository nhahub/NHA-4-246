import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { requestPasswordReset } from '../../store/authSlice';
import { AuthLayout } from './AuthLayout';

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector(s => s.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isLoading = status === 'loading';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address.'); return; }
    setEmailError('');

    await dispatch(requestPasswordReset({ email: email.trim() }));
    // Always show the neutral confirmation — don't reveal whether email exists.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your inbox" subtitle="A reset link is on its way.">
        <div
          className="rounded-2xl px-4 py-4 text-sm flex flex-col gap-2"
          style={{ backgroundColor: '#F4F7FB', border: '2px solid #E2E8F0', fontFamily: 'Inter, sans-serif', color: '#1A202C' }}
        >
          <p>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link to that address.
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>
            Didn't receive it? Check your spam folder, or{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="underline font-medium transition-colors hover:opacity-70"
              style={{ color: '#153C70', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              try again
            </button>
            .
          </p>
        </div>

        <Link
          to="/auth/login"
          className="text-center text-xs font-semibold transition-colors hover:opacity-70"
          style={{ color: '#153C70', fontFamily: 'Inter, sans-serif' }}
        >
          ← Back to log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="forgot-email"
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: '#718096', fontFamily: 'Poppins, sans-serif' }}
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby={emailError ? 'forgot-email-error' : undefined}
            aria-invalid={!!emailError}
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
            style={{
              border: emailError ? '2px solid #DC2626' : '2px solid #E2E8F0',
              fontFamily: 'Inter, sans-serif',
              color: '#1A202C',
              backgroundColor: '#F4F7FB',
            }}
            onFocus={e => { if (!emailError) e.currentTarget.style.border = '2px solid #153C70'; }}
            onBlur={e => { if (!emailError) e.currentTarget.style.border = '2px solid #E2E8F0'; }}
          />
          {emailError && (
            <p id="forgot-email-error" role="alert" className="text-xs" style={{ color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>
              {emailError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          {isLoading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <Link
        to="/auth/login"
        className="text-center text-xs font-semibold transition-colors hover:opacity-70"
        style={{ color: '#153C70', fontFamily: 'Inter, sans-serif' }}
      >
        ← Back to log in
      </Link>
    </AuthLayout>
  );
}
