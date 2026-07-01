import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BeeIconState {
  visible: boolean;
  selectedText: string;
  anchorX: number;
  anchorY: number;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  beeIcon: BeeIconState;
  toast: ToastState;
  addWordInputOpen: boolean;
  addWordText: string;
}

const initialState: UIState = {
  beeIcon: { visible: false, selectedText: '', anchorX: 0, anchorY: 0 },
  toast: { visible: false, message: '', type: 'info' },
  addWordInputOpen: false,
  addWordText: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showBeeIcon(state, action: PayloadAction<{ text: string; x: number; y: number }>) {
      state.beeIcon = { visible: true, selectedText: action.payload.text, anchorX: action.payload.x, anchorY: action.payload.y };
    },
    hideBeeIcon(state) {
      state.beeIcon = { ...state.beeIcon, visible: false };
    },
    showToast(state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) {
      state.toast = { visible: true, ...action.payload };
    },
    hideToast(state) {
      state.toast = { ...state.toast, visible: false };
    },
    openAddWord(state) { state.addWordInputOpen = true; },
    closeAddWord(state) { state.addWordInputOpen = false; state.addWordText = ''; },
    setAddWordText(state, action: PayloadAction<string>) { state.addWordText = action.payload; },
  },
});

export const {
  showBeeIcon, hideBeeIcon, showToast, hideToast,
  openAddWord, closeAddWord, setAddWordText,
} = uiSlice.actions;
export default uiSlice.reducer;
