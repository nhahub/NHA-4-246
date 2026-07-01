import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PhonemeStatus, PronunciationResult } from '../services/api/types';
import { getPhonemeList, getWordForPhoneme, assessPronunciation as apiAssess } from '../services/api/mockApi';

type PhonemeMode = 'phoneme' | 'word';

interface PronounceState {
  phonemes: PhonemeStatus[];
  phonemesLoading: boolean;
  activePhoneme: string | null;
  mode: PhonemeMode;
  currentWord: string | null;
  wordLoading: boolean;
  assessmentResult: PronunciationResult | null;
  assessing: boolean;
  error: string | null;
}

const initialState: PronounceState = {
  phonemes: [],
  phonemesLoading: false,
  activePhoneme: null,
  mode: 'phoneme',
  currentWord: null,
  wordLoading: false,
  assessmentResult: null,
  assessing: false,
  error: null,
};

export const loadPhonemes = createAsyncThunk('pronounce/loadPhonemes', async () => {
  return await getPhonemeList();
});

export const loadWordForPhoneme = createAsyncThunk(
  'pronounce/loadWord',
  async (phoneme: string) => {
    return await getWordForPhoneme(phoneme);
  }
);

export const runAssessment = createAsyncThunk(
  'pronounce/assess',
  async (input: { audioBlob: Blob; word: string; targetLang: string }) => {
    return await apiAssess(input);
  }
);

const pronounceSlice = createSlice({
  name: 'pronounce',
  initialState,
  reducers: {
    setActivePhoneme(state, action: PayloadAction<string>) {
      state.activePhoneme = action.payload;
      state.mode = 'phoneme';
      state.currentWord = null;
      state.assessmentResult = null;
    },
    setMode(state, action: PayloadAction<PhonemeMode>) {
      state.mode = action.payload;
    },
    resetAssessment(state) {
      state.assessmentResult = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadPhonemes.pending, state => { state.phonemesLoading = true; })
      .addCase(loadPhonemes.fulfilled, (state, action) => {
        state.phonemesLoading = false;
        state.phonemes = action.payload;
      })
      .addCase(loadPhonemes.rejected, state => { state.phonemesLoading = false; })
      .addCase(loadWordForPhoneme.pending, state => { state.wordLoading = true; })
      .addCase(loadWordForPhoneme.fulfilled, (state, action) => {
        state.wordLoading = false;
        state.currentWord = action.payload.word;
        state.mode = 'word';
        state.assessmentResult = null;
      })
      .addCase(runAssessment.pending, state => { state.assessing = true; state.error = null; })
      .addCase(runAssessment.fulfilled, (state, action) => {
        state.assessing = false;
        state.assessmentResult = action.payload;
        // Update phoneme status in list
        if (state.activePhoneme) {
          const score = action.payload.score;
          const status: 'excellent' | 'good' | 'wrong' =
            score >= 80 ? 'excellent' : score >= 50 ? 'good' : 'wrong';
          const ph = state.phonemes.find(p => p.phoneme === state.activePhoneme);
          if (ph) ph.status = status;
        }
      })
      .addCase(runAssessment.rejected, (state, action) => {
        state.assessing = false;
        state.error = action.error.message || 'Assessment failed';
      });
  },
});

export const { setActivePhoneme, setMode, resetAssessment } = pronounceSlice.actions;
export default pronounceSlice.reducer;
