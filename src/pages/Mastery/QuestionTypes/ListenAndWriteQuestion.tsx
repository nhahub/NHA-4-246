import React from 'react';
import { ReviewItem } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUserAnswer } from '../../../store/masterySessionSlice';

interface Props { item: ReviewItem; disabled?: boolean; }

export function ListenAndWriteQuestion({ item, disabled }: Props) {
  const dispatch = useAppDispatch();
  const { userAnswer } = useAppSelector(s => s.mastery);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex flex-col items-center gap-3" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold uppercase" style={{ color: '#153C70' }}>Listen & Write</p>
        <p className="text-sm text-center" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
          (In the real app, an audio clip of the word plays here)
        </p>
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md"
          style={{ backgroundColor: '#153C70', color: 'white' }}
          onClick={() => alert(`Playing: ${item.headword}`)}
          aria-label="Play audio"
        >
          🔊
        </button>
        <p className="text-xs" style={{ color: '#718096' }}>Tap to play the word</p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#718096' }}>
          Write what you hear:
        </label>
        <input
          type="text"
          value={userAnswer}
          onChange={e => dispatch(setUserAnswer(e.target.value))}
          disabled={disabled}
          placeholder="Type the word here…"
          className="w-full px-4 py-3 rounded-2xl text-sm border outline-none"
          style={{ border: '2px solid #E2E8F0', fontFamily: 'Inter, sans-serif', color: '#1A202C', opacity: disabled ? 0.7 : 1 }}
        />
      </div>
    </div>
  );
}
