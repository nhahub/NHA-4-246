import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { confirmPasswordReset, clearAuthError } from '../../store/authSlice';
import { showToast } from '../../store/uiSlice';
import { AuthLayout } from './AuthLayout';

export default function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, error: authError } = useAppSelector(s => s.auth);

  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [expiredToken, setExpiredToken] = useState(false);

  const isLoading = status === 'loading';

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!confirm) errors.confirm = 'Please confirm your password.';
    else if (confirm !== password) errors.confirm = "Passwords don't match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    setExpiredToken(false);
    if (!validate()) return;

    const result = await dispatch(confirmPasswordReset({ token, newPassword: password }));
    if (confirmPasswordReset.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Password updated! Please log in.', type: 'success' }));
      navigate('/auth/login');
    } else if (confirmPasswordReset.rejected.match(result)) {
      const payload = result.payload as { type?: string } | undefined;
      if (payload?.type === 'expired_token') setExpiredToken(true);
    }
  }

  // Expired token state
  if (expiredToken) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is no longer valid.">
        <div
          className="rounded-2xl px-4 py-4 text-sm flex flex-col gap-2"
          style={{ backgroundColor: '#FEF3C7', border: '2px solid #F59E0B', fontFamily: 'Inter, sans-serif', color: '#92400E' }}
        >
          <p>This password reset link has expired or has already been used.</p>
        </div>

        <Link
          to="/auth/forgot-password"
          className="w-full py-3 rounded-full text-sm font-bold text-white text-center transition-all hover:opacity-90 active:scale-95 block"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          Request a new link
        </Link>

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
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reset-password"
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: '#718096', fontFamily: 'Poppins, sans-serif' }}
          >
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); dispatch(clearAuthError()); }}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-describedby={fieldErrors.password ? 'reset-password-error' : 'reset-password-hint'}
            aria-invalid={!!fieldErrors.password}
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
            style={{
              border: fieldErrors.password ? '2px solid #DC2626' : '2px solid #E2E8F0',
              fontFamily: 'Inter, sans-serif',
              color: '#1A202C',
              backgroundColor: '#F4F7FB',
            }}
            onFocus={e => { if (!fieldErrors.password) e.currentTarget.style.border = '2px solid #153C70'; }}
            onBlur={e => { if (!fieldErrors.password) e.currentTarget.style.border = '2px solid #E2E8F0'; }}
          />
          {fieldErrors.password
            ? <p id="reset-password-error" role="alert" className="text-xs" style={{ color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{fieldErrors.password}</p>
            : <p id="reset-password-hint" className="text-xs" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>At least 8 characters.</p>
          }
        </div>

        {/* Confirm field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reset-confirm"
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: '#718096', fontFamily: 'Poppins, sans-serif' }}
          >
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: undefined })); }}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-describedby={fieldErrors.confirm ? 'reset-confirm-error' : undefined}
            aria-invalid={!!fieldErrors.confirm}
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
            style={{
              border: fieldErrors.confirm ? '2px solid #DC2626' : '2px solid #E2E8F0',
              fontFamily: 'Inter, sans-serif',
              color: '#1A202C',
              backgroundColor: '#F4F7FB',
            }}
            onFocus={e => { if (!fieldErrors.confirm) e.currentTarget.style.border = '2px solid #153C70'; }}
            onBlur={e => { if (!fieldErrors.confirm) e.currentTarget.style.border = '2px solid #E2E8F0'; }}
          />
          {fieldErrors.confirm && (
            <p id="reset-confirm-error" role="alert" className="text-xs" style={{ color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{fieldErrors.confirm}</p>
          )}
        </div>

        {/* Generic server error */}
        {authError && status === 'error' && !expiredToken && (
          <p role="alert" className="text-xs px-4 py-2.5 rounded-xl" style={{ color: '#991B1B', backgroundColor: '#FEE2E2', fontFamily: 'Inter, sans-serif' }}>
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-1"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          {isLoading ? 'Updating password…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
