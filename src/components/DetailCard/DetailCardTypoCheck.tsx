import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { rejectCorrection } from '../../store/detailCardSlice';

interface Props {
  onAccept: (text: string) => void;
}

export function DetailCardTypoCheck({ onAccept }: Props) {
  const dispatch = useAppDispatch();
  const { suggestedCorrection, currentText } = useAppSelector(s => s.detailCard);

  return (
    <div className="flex flex-col items-center gap-5 py-8 px-4 text-center">
      <div className="text-4xl">🔤</div>
      <div>
        <p className="text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
          Did you mean:
        </p>
        <p className="mt-1 text-xl font-bold" style={{ color: '#153C70', fontFamily: 'Poppins, sans-serif' }}>
          {suggestedCorrection}
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => onAccept(suggestedCorrection!)}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          Yes, use this
        </button>
        <button
          onClick={() => dispatch(rejectCorrection())}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-gray-100 active:scale-95"
          style={{ color: '#153C70', border: '2px solid #153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          No, edit
        </button>
      </div>
    </div>
  );
}
