import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { hideToast } from '../../store/uiSlice';

export function Toast() {
  const dispatch = useAppDispatch();
  const { visible, message, type } = useAppSelector(s => s.ui.toast);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dispatch(hideToast()), 3500);
    return () => clearTimeout(t);
  }, [visible, message, dispatch]);

  if (!visible) return null;

  const bg: Record<string, string> = {
    success: '#065F46',
    error: '#991B1B',
    info: '#153C70',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg transition-all"
      style={{ backgroundColor: bg[type], fontFamily: 'Poppins, sans-serif', maxWidth: '90vw' }}
    >
      {message}
    </div>
  );
}
