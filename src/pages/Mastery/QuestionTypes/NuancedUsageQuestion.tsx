import React from 'react';
import { ReviewItem } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUserAnswer } from '../../../store/masterySessionSlice';

interface Props { item: ReviewItem; disabled?: boolean; }

export function NuancedUsageQuestion({ item, disabled }: Props) {
  const dispatch = useAppDispatch();
  const { userAnswer } = useAppSelector(s => s.mastery);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#153C70' }}>Nuanced Usage</p>
        <p className="text-base" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
          {item.nuancedPrompt}
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#718096' }}>
          Your nuanced sentence:
        </label>
        <textarea
          value={userAnswer}
          onChange={e => dispatch(setUserAnswer(e.target.value))}
          disabled={disabled}
          rows={4}
          placeholder="Write a sentence that shows you understand the subtle meaning…"
          className="w-full px-4 py-3 rounded-2xl text-sm border outline-none resize-none"
          style={{ border: '2px solid #E2E8F0', fontFamily: 'Inter, sans-serif', color: '#1A202C', opacity: disabled ? 0.7 : 1 }}
        />
        <p className="mt-1 text-xs" style={{ color: '#718096' }}>
          Show that you understand the subtle, context-specific meaning.
        </p>
      </div>
    </div>
  );
}
