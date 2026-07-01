import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { hideBeeIcon } from '../../store/uiSlice';
import { openCard } from '../../store/detailCardSlice';
import { useDetailCardFlow } from '../DetailCard/useDetailCardFlow';

export function BeeIcon() {
  const dispatch = useAppDispatch();
  const { visible, selectedText, anchorX, anchorY } = useAppSelector(s => s.ui.beeIcon);
  const { triggerCardOpen } = useDetailCardFlow();

  if (!visible) return null;

  const handleClick = () => {
    dispatch(hideBeeIcon());
    triggerCardOpen(selectedText);
  };

  return (
    <button
      data-bee-icon="true"
      onClick={handleClick}
      aria-label={`Look up "${selectedText}"`}
      className="fixed z-40 flex items-center justify-center w-10 h-10 rounded-full shadow-xl text-lg transition-all hover:scale-110 active:scale-95"
      style={{
        left: anchorX - 20,
        top: anchorY - 44,
        backgroundColor: '#153C70',
        border: '3px solid white',
      }}
    >
      🐝
    </button>
  );
}
