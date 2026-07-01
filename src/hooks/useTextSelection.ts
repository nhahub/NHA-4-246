import { useEffect, useCallback } from 'react';
import { useAppDispatch } from '../store';
import { showBeeIcon, hideBeeIcon } from '../store/uiSlice';

/**
 * useTextSelection — attaches a global mouseup listener to detect text selection.
 * On valid selection, dispatches showBeeIcon with the selected text and screen position.
 * On click-without-selection or outside, hides the bee icon.
 */
export function useTextSelection() {
  const dispatch = useAppDispatch();

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) {
      dispatch(hideBeeIcon());
      return;
    }

    const range = selection!.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    dispatch(showBeeIcon({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    }));
  }, [dispatch]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Hide bee icon if clicking on something other than the bee itself
    const target = e.target as Element;
    if (!target.closest('[data-bee-icon]') && !target.closest('[data-detail-card]')) {
      dispatch(hideBeeIcon());
    }
  }, [dispatch]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);
}
