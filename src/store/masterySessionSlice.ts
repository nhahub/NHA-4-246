import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReviewItem } from '../services/api/types';
import { getMasterySession, submitAnswer as apiSubmitAnswer } from '../services/api/mockApi';

interface MasterySessionState {
  queue: ReviewItem[];
  currentIndex: number;
  totalToday: number;
  solved: number;
  lastAnswerResult: { isCorrect: boolean; newStage: number } | null;
  answered: boolean;
  userAnswer: string;
  loading: boolean;
  error: string | null;
  sessionComplete: boolean;
}

const initialState: MasterySessionState = {
  queue: [],
  currentIndex: 0,
  totalToday: 0,
  solved: 0,
  lastAnswerResult: null,
  answered: false,
  userAnswer: '',
  loading: false,
  error: null,
  sessionComplete: false,
};

export const loadMasterySession = createAsyncThunk('mastery/loadSession', async () => {
  return await getMasterySession();
});

export const submitMasteryAnswer = createAsyncThunk(
  'mastery/submitAnswer',
  async (input: { wordId: string; reviewId: string; userAnswer: string; questionType: number }) => {
    return await apiSubmitAnswer(input);
  }
);

const masterySessionSlice = createSlice({
  name: 'mastery',
  initialState,
  reducers: {
    setUserAnswer(state, action: PayloadAction<string>) {
      state.userAnswer = action.payload;
    },
    advanceToNext(state) {
      if (state.currentIndex + 1 >= state.queue.length) {
        state.sessionComplete = true;
      } else {
        state.currentIndex += 1;
        state.answered = false;
        state.lastAnswerResult = null;
        state.userAnswer = '';
      }
    },
    resetSession(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMasterySession.pending, state => {
        state.loading = true; state.error = null;
      })
      .addCase(loadMasterySession.fulfilled, (state, action) => {
        state.loading = false;
        state.queue = action.payload.queue;
        state.totalToday = action.payload.totalToday;
        state.currentIndex = 0;
        state.solved = 0;
        state.sessionComplete = false;
      })
      .addCase(loadMasterySession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load session';
      })
      .addCase(submitMasteryAnswer.fulfilled, (state, action) => {
        state.answered = true;
        state.lastAnswerResult = action.payload;
        if (action.payload.isCorrect) state.solved += 1;
      });
  },
});

export const { setUserAnswer, advanceToNext, resetSession } = masterySessionSlice.actions;
export default masterySessionSlice.reducer;
