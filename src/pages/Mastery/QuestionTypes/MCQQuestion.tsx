import React from 'react';
import { ReviewItem } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUserAnswer } from '../../../store/masterySessionSlice';

interface Props { item: ReviewItem; disabled?: boolean; }

export function MCQQuestion({ item, disabled }: Props) {
  const dispatch = useAppDispatch();
  const { userAnswer } = useAppSelector(s => s.mastery);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#153C70' }}>Word</p>
        <p className="text-2xl font-bold" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
          {item.headword}
        </p>
        <p className="mt-1 text-sm" style={{ color: '#718096' }}>Which definition is correct?</p>
      </div>
      <div className="flex flex-col gap-2.5" style={disabled ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
        {item.mcqOptions?.map((opt, i) => (
          <button
            key={i}
            onClick={() => dispatch(setUserAnswer(opt))}
            className="w-full px-4 py-3 rounded-2xl text-sm text-left transition-all hover:border-blue-400"
            style={{
              border: `2px solid ${userAnswer === opt ? '#153C70' : '#E2E8F0'}`,
              backgroundColor: userAnswer === opt ? '#F4F7FB' : 'white',
              color: '#1A202C',
              fontFamily: 'Inter, sans-serif',
              fontWeight: userAnswer === opt ? 600 : 400,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
