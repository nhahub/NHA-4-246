import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  signUp as apiSignUp,
  signIn as apiSignIn,
  signOut as apiSignOut,
  requestPasswordReset as apiRequestReset,
  confirmPasswordReset as apiConfirmReset,
  restoreSession as apiRestoreSession,
  AuthUser,
} from '../services/api/auth';

// ─── State ────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (input: { email: string; password: string }, { rejectWithValue }) => {
    const result = await apiSignUp(input);
    if ('error' in result) return rejectWithValue(result.error);
    return { id: result.userId, email: input.email };
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (input: { email: string; password: string }, { rejectWithValue }) => {
    const result = await apiSignIn(input);
    if ('error' in result) return rejectWithValue(result.error);
    return { id: result.userId, email: result.email };
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await apiSignOut();
});

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (input: { email: string }) => {
    await apiRequestReset(input);
  },
);

export const confirmPasswordReset = createAsyncThunk(
  'auth/confirmPasswordReset',
  async (input: { token: string; newPassword: string }, { rejectWithValue }) => {
    const result = await apiConfirmReset(input);
    if ('error' in result) return rejectWithValue(result.error);
    return { success: true };
  },
);

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  return await apiRestoreSession();
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // ── restoreSession ──
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
        state.status = 'authenticated';
      } else {
        state.status = 'unauthenticated';
      }
      state.error = null;
    });
    builder.addCase(restoreSession.rejected, state => {
      state.status = 'unauthenticated';
    });

    // ── signUp ──
    builder.addCase(signUp.pending, state => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(signUp.fulfilled, (state, action) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    });
    builder.addCase(signUp.rejected, (state, action) => {
      state.status = 'error';
      const payload = action.payload as { message: string } | undefined;
      state.error = payload?.message ?? 'Sign-up failed. Please try again.';
    });

    // ── signIn ──
    builder.addCase(signIn.pending, state => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    });
    builder.addCase(signIn.rejected, (state, action) => {
      state.status = 'error';
      const payload = action.payload as { message: string } | undefined;
      state.error = payload?.message ?? 'Sign-in failed. Please try again.';
    });

    // ── signOut ──
    builder.addCase(signOut.fulfilled, state => {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    });

    // ── requestPasswordReset ──
    builder.addCase(requestPasswordReset.pending, state => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(requestPasswordReset.fulfilled, state => {
      // Don't change auth status — user is still unauthenticated
      state.status = 'unauthenticated';
    });

    // ── confirmPasswordReset ──
    builder.addCase(confirmPasswordReset.pending, state => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(confirmPasswordReset.fulfilled, state => {
      state.status = 'unauthenticated';
      state.error = null;
    });
    builder.addCase(confirmPasswordReset.rejected, (state, action) => {
      state.status = 'error';
      const payload = action.payload as { message: string } | undefined;
      state.error = payload?.message ?? 'Password reset failed. Please try again.';
    });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
