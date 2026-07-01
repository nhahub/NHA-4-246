import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  nativeLanguage: string;
  targetLanguage: string;
  onboarded: boolean;
}

const LANGUAGES = [
  'English','Arabic','Spanish','French','German','Italian','Portuguese',
  'Russian','Mandarin Chinese','Japanese','Korean','Hindi','Turkish',
  'Dutch','Polish','Swedish','Greek','Hebrew','Indonesian','Vietnamese',
  'Thai','Ukrainian','Romanian','Czech','Hungarian','Finnish','Danish',
  'Norwegian','Bengali','Urdu','Persian','Swahili',
];

const TARGET_LANGUAGES = ['English', 'French'];

const initialState: UserState = (() => {
  try {
    const stored = localStorage.getItem('lexi_user');
    if (stored) return JSON.parse(stored) as UserState;
  } catch { /* ignore */ }
  return { nativeLanguage: 'Arabic', targetLanguage: 'English', onboarded: false };
})();

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLanguages(state, action: PayloadAction<{ nativeLanguage: string; targetLanguage: string }>) {
      state.nativeLanguage = action.payload.nativeLanguage;
      state.targetLanguage = action.payload.targetLanguage;
    },
    setOnboarded(state, action: PayloadAction<boolean>) {
      state.onboarded = action.payload;
    },
    completeOnboarding(state, action: PayloadAction<{ nativeLanguage: string; targetLanguage: string }>) {
      state.nativeLanguage = action.payload.nativeLanguage;
      state.targetLanguage = action.payload.targetLanguage;
      state.onboarded = true;
    },
  },
});

export { LANGUAGES, TARGET_LANGUAGES };
export const { setLanguages, setOnboarded, completeOnboarding } = userSlice.actions;
export default userSlice.reducer;
