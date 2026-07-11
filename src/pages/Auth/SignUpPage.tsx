import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { signUp, clearAuthError } from '../../store/authSlice';
import { AuthLayout } from './AuthLayout';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}

function Field({ id, label, type, value, onChange, error, autoComplete, placeholder, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: '#718096', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
        style={{
          border: error ? '2px solid #DC2626' : '2px solid #E2E8F0',
          fontFamily: 'Inter, sans-serif',
          color: '#1A202C',
          backgroundColor: '#F4F7FB',
        }}
        onFocus={e => { if (!error) e.currentTarget.style.border = '2px solid #153C70'; }}
        onBlur={e => { if (!error) e.currentTarget.style.border = '2px solid #E2E8F0'; }}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs" style={{ color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error: authError } = useAppSelector(s => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [emailTakenError, setEmailTakenError] = useState('');

  const isLoading = status === 'loading';

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!confirm) errors.confirm = 'Please confirm your password.';
    else if (confirm !== password) errors.confirm = 'Passwords don\'t match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    setEmailTakenError('');
    if (!validate()) return;

    const result = await dispatch(signUp({ email: email.trim(), password }));
    if (signUp.fulfilled.match(result)) {
      navigate('/onboarding');
    } else if (signUp.rejected.match(result)) {
      const payload = result.payload as { type?: string; message?: string } | undefined;
      if (payload?.type === 'email_taken') {
        setEmailTakenError(payload.message ?? 'This email is already in use.');
      }
      // other errors surface via authError from the slice
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start your language learning journey.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          id="signup-email"
          label="Email"
          type="email"
          value={email}
          onChange={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: undefined })); setEmailTakenError(''); dispatch(clearAuthError()); }}
          error={emailTakenError || fieldErrors.email}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          id="signup-password"
          label="Password"
          type="password"
          value={password}
          onChange={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: undefined })); dispatch(clearAuthError()); }}
          error={fieldErrors.password}
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters."
        />
        <Field
          id="signup-confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={v => { setConfirm(v); setFieldErrors(p => ({ ...p, confirm: undefined })); }}
          error={fieldErrors.confirm}
          autoComplete="new-password"
          placeholder="••••••••"
        />

        {/* Generic server error (not email_taken, handled above) */}
        {authError && status === 'error' && !emailTakenError && (
          <p
            role="alert"
            className="text-xs px-4 py-2.5 rounded-xl"
            style={{ color: '#991B1B', backgroundColor: '#FEE2E2', fontFamily: 'Inter, sans-serif' }}
          >
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-1"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-xs" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="font-semibold transition-colors hover:opacity-70"
          style={{ color: '#153C70' }}
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
