import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DetailCardData } from '../services/api/types';

export type DetailCardMode =
  | 'idle'
  | 'loading'
  | 'too_long'
  | 'typo_check'
  | 'editing'
  | 'simplified'
  | 'full'
  | 'watch'
  | 'pronounce';

interface DetailCardState {
  isOpen: boolean;
  mode: DetailCardMode;
  retryCount: number;
  currentText: string;
  originalText: string;
  suggestedCorrection: string | null;
  card: DetailCardData | null;
  translationsVisible: boolean;
}

const initialState: DetailCardState = {
  isOpen: false,
  mode: 'idle',
  retryCount: 0,
  currentText: '',
  originalText: '',
  suggestedCorrection: null,
  card: null,
  translationsVisible: false,
};

const detailCardSlice = createSlice({
  name: 'detailCard',
  initialState,
  reducers: {
    openCard(state, action: PayloadAction<string>) {
      state.isOpen = true;
      state.mode = 'loading';
      state.currentText = action.payload;
      state.originalText = action.payload;
      state.retryCount = 0;
      state.suggestedCorrection = null;
      state.card = null;
      state.translationsVisible = false;
    },
    closeCard(state) {
      Object.assign(state, initialState);
    },
    setMode(state, action: PayloadAction<DetailCardMode>) {
      state.mode = action.payload;
    },
    setCard(state, action: PayloadAction<DetailCardData>) {
      state.card = action.payload;
    },
    setSuggestedCorrection(state, action: PayloadAction<string>) {
      state.suggestedCorrection = action.payload;
      state.mode = 'typo_check';
    },
    acceptCorrection(state) {
      if (state.suggestedCorrection) {
        state.currentText = state.suggestedCorrection;
        state.suggestedCorrection = null;
        state.mode = 'loading';
      }
    },
    rejectCorrection(state) {
      state.mode = 'editing';
      state.suggestedCorrection = null;
    },
    setEditText(state, action: PayloadAction<string>) {
      state.currentText = action.payload;
    },
    submitEdit(state) {
      if (state.retryCount >= 4) {
        // Too many retries → revert to original
        state.currentText = state.originalText;
        state.retryCount = 0;
      } else {
        state.retryCount += 1;
      }
      state.mode = 'loading';
    },
    toggleTranslations(state) {
      state.translationsVisible = !state.translationsVisible;
    },
  },
});

export const {
  openCard, closeCard, setMode, setCard, setSuggestedCorrection,
  acceptCorrection, rejectCorrection, setEditText, submitEdit,
  toggleTranslations,
} = detailCardSlice.actions;
export default detailCardSlice.reducer;
