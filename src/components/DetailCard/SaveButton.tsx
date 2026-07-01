import React, { useState } from 'react';
import { DetailCardData } from '../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { saveWordThunk, removeWordThunk } from '../../store/wordsSlice';
import { setSaved, showRemoveConfirm, hideRemoveConfirm } from '../../store/detailCardSlice';
import { showToast } from '../../store/uiSlice';
import { addSessionWord } from '../../store/watchSlice';

interface Props {
  card: DetailCardData;
  source?: 'manual' | 'watch' | 'explore' | 'selection';
}

export function SaveButton({ card, source = 'manual' }: Props) {
  const dispatch = useAppDispatch();
  const { isSaved, showRemoveConfirm: confirmVisible } = useAppSelector(s => s.detailCard);
  const savedWordIds = useAppSelector(s => s.words.ids);
  const isActuallySaved = savedWordIds.includes(card.id) || isSaved;
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isActuallySaved) {
      dispatch(showRemoveConfirm());
      return;
    }
    setSaving(true);
    try {
      await dispatch(saveWordThunk({ word: card, source })).unwrap();
      dispatch(setSaved(true));
      if (source === 'watch') {
        dispatch(addSessionWord({
          headword: card.headword,
          nativeTranslation: card.nativeTranslation || card.synonyms[0] || '',
        }));
      }
      dispatch(showToast({ message: `"${card.headword}" saved!`, type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to save. Please try again.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      await dispatch(removeWordThunk(card.id)).unwrap();
      dispatch(setSaved(false));
      dispatch(hideRemoveConfirm());
      dispatch(showToast({ message: `"${card.headword}" removed.`, type: 'info' }));
    } catch {
      dispatch(showToast({ message: 'Failed to remove. Please try again.', type: 'error' }));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSave}
        disabled={saving}
        aria-label={isActuallySaved ? 'Remove word' : 'Save word'}
        className="py-2.5 px-4 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
        style={{
          backgroundColor: isActuallySaved ? '#D1FAE5' : '#153C70',
          color: isActuallySaved ? '#065F46' : 'white',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {saving ? '...' : isActuallySaved ? '✓ Saved' : 'Save'}
      </button>

      {/* Remove confirmation popover */}
      {confirmVisible && (
        <div
          className="absolute bottom-12 right-0 z-10 rounded-2xl shadow-xl p-4 flex flex-col gap-3 min-w-[180px]"
          style={{ background: 'white', border: '2px solid #E2E8F0' }}
        >
          <p className="text-sm font-medium" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
            Remove word?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRemove}
              className="flex-1 py-2 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: '#991B1B' }}
            >
              Remove
            </button>
            <button
              onClick={() => dispatch(hideRemoveConfirm())}
              className="flex-1 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#F4F7FB', color: '#718096' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
