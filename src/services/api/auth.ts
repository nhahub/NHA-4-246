// ─── Auth Service Layer ───────────────────────────────────────────────────────
// Real Supabase Auth implementation. Signatures are frozen — authSlice depends on them.

import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export type SignUpResult =
  | { userId: string }
  | { error: { type: 'email_taken' | 'weak_password' | 'unknown'; message: string } };

export type SignInResult =
  | { userId: string; email: string }
  | { error: { type: 'invalid_credentials' | 'unknown'; message: string } };

export type PasswordResetResult =
  | { success: true }
  | { error: { type: 'expired_token' | 'weak_password' | 'unknown'; message: string } };

// ─── Service Functions ────────────────────────────────────────────────────────

export async function signUp(input: { email: string; password: string }): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) {
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered')) {
      return { error: { type: 'email_taken', message: 'An account with this email already exists.' } };
    }
    if (error.message.toLowerCase().includes('password')) {
      return { error: { type: 'weak_password', message: error.message } };
    }
    return { error: { type: 'unknown', message: error.message } };
  }
  return { userId: data.user!.id };
}

export async function signIn(input: { email: string; password: string }): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) {
    if (error.message.toLowerCase().includes('invalid') ||
        error.message.toLowerCase().includes('credentials')) {
      return { error: { type: 'invalid_credentials', message: 'Email or password is incorrect.' } };
    }
    return { error: { type: 'unknown', message: error.message } };
  }
  return { userId: data.user.id, email: data.user.email! };
}

export async function signOut(): Promise<{ success: boolean }> {
  await supabase.auth.signOut();
  return { success: true };
}

export async function requestPasswordReset(_input: { email: string }): Promise<{ success: boolean }> {
  // Always returns success — must not reveal whether the email exists.
  await supabase.auth.resetPasswordForEmail(_input.email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { success: true };
}

export async function confirmPasswordReset(input: {
  token: string;
  newPassword: string;
}): Promise<{ success: true } | PasswordResetResult> {
  // After the user clicks the reset link, Supabase establishes a session automatically.
  // We call updateUser to set the new password within that session.
  // The `token` param is unused here (Supabase handles it via the URL hash on landing).
  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) {
    if (error.message.toLowerCase().includes('expired') ||
        error.message.toLowerCase().includes('invalid')) {
      return { error: { type: 'expired_token', message: 'This reset link has expired. Please request a new one.' } };
    }
    if (error.message.toLowerCase().includes('password')) {
      return { error: { type: 'weak_password', message: error.message } };
    }
    return { error: { type: 'unknown', message: error.message } };
  }
  return { success: true };
}

export async function restoreSession(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email! };
}
