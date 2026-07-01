import React from 'react';
import { ReviewItem } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUserAnswer } from '../../../store/masterySessionSlice';

interface Props { item: ReviewItem; disabled?: boolean; }

export function FillInBlanksQuestion({ item, disabled }: Props) {
  const dispatch = useAppDispatch();
  const { userAnswer } = useAppSelector(s => s.mastery);

  // Replace ___ in the sentence with a styled blank indicator
  const parts = (item.fillSentence || '').split('___');

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#153C70' }}>Fill in the blank</p>
        <p className="text-base leading-relaxed" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
          {parts[0]}
          <span
            className="inline-block px-3 py-0.5 mx-1 rounded-lg font-bold"
            style={{ backgroundColor: '#153C70', color: 'white', minWidth: 80 }}
          >
            {userAnswer || '___'}
          </span>
          {parts[1]}
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#718096' }}>
          Your answer:
        </label>
        <input
          type="text"
          value={userAnswer}
          onChange={e => dispatch(setUserAnswer(e.target.value))}
          disabled={disabled}
          placeholder={`Fill in the blank…`}
          className="w-full px-4 py-3 rounded-2xl text-sm border outline-none"
          style={{ border: '2px solid #E2E8F0', fontFamily: 'Inter, sans-serif', color: '#1A202C', opacity: disabled ? 0.7 : 1 }}
        />
      </div>
    </div>
  );
}
