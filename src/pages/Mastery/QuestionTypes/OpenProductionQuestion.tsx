import React from 'react';
import { ReviewItem } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUserAnswer } from '../../../store/masterySessionSlice';

interface Props { item: ReviewItem; disabled?: boolean; }

export function OpenProductionQuestion({ item, disabled }: Props) {
  const dispatch = useAppDispatch();
  const { userAnswer } = useAppSelector(s => s.mastery);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#153C70' }}>Open Production</p>
        <p className="text-base" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
          {item.productionPrompt}
        </p>
        <div
          className="mt-3 px-3 py-2 rounded-xl text-xs"
          style={{ backgroundColor: '#E0E7FF', color: '#3730A3' }}
        >
          💡 Write in your own words — no right or wrong structure.
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#718096' }}>
          Your original sentence:
        </label>
        <textarea
          value={userAnswer}
          onChange={e => dispatch(setUserAnswer(e.target.value))}
          disabled={disabled}
          rows={4}
          placeholder="Express yourself freely…"
          className="w-full px-4 py-3 rounded-2xl text-sm border outline-none resize-none"
          style={{ border: '2px solid #E2E8F0', fontFamily: 'Inter, sans-serif', color: '#1A202C', opacity: disabled ? 0.7 : 1 }}
        />
      </div>
    </div>
  );
}
