import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { signIn, clearAuthError } from '../../store/authSlice';
import { AuthLayout } from './AuthLayout';

// ─── Reusable field components ────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}

function Field({ id, label, type, value, onChange, error, autoComplete, placeholder }: FieldProps) {
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
        aria-describedby={error ? `${id}-error` : undefined}
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
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs"
          style={{ color: '#DC2626', fontFamily: 'Inter, sans-serif' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error: authError } = useAppSelector(s => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const isLoading = status === 'loading';

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    if (!validate()) return;

    const result = await dispatch(signIn({ email: email.trim(), password }));
    if (signIn.fulfilled.match(result)) {
      navigate('/mastery');
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue learning.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: undefined })); dispatch(clearAuthError()); }}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          id="login-password"
          label="Password"
          type="password"
          value={password}
          onChange={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: undefined })); dispatch(clearAuthError()); }}
          error={fieldErrors.password}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        {/* Server-level error (invalid credentials) */}
        {authError && status === 'error' && (
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
          {isLoading ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="flex flex-col gap-2 text-center">
        <Link
          to="/auth/forgot-password"
          className="text-xs transition-colors hover:opacity-70"
          style={{ color: '#153C70', fontFamily: 'Inter, sans-serif' }}
        >
          Forgot your password?
        </Link>
        <p className="text-xs" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
          Don't have an account?{' '}
          <Link
            to="/auth/signup"
            className="font-semibold transition-colors hover:opacity-70"
            style={{ color: '#153C70' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
