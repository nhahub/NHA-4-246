import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import userReducer from './userSlice';
import wordsReducer from './wordsSlice';
import detailCardReducer from './detailCardSlice';
import masterySessionReducer from './masterySessionSlice';
import vaultReducer from './vaultSlice';
import watchReducer from './watchSlice';
import exploreReducer from './exploreSlice';
import pronounceReducer from './pronounceSlice';
import uiReducer from './uiSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    words: wordsReducer,
    detailCard: detailCardReducer,
    mastery: masterySessionReducer,
    vault: vaultReducer,
    watch: watchReducer,
    explore: exploreReducer,
    pronounce: pronounceReducer,
    ui: uiReducer,
  },
  middleware: getDefault =>
    getDefault({ serializableCheck: { ignoredActions: ['pronounce/assess/pending'] } }),
});

// Persist user + auth state to localStorage
store.subscribe(() => {
  try {
    const { user } = store.getState();
    localStorage.setItem('lexi_user', JSON.stringify(user));
  } catch { /* ignore */ }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

