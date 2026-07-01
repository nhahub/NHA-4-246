import React, { useState } from 'react';
import { useAppSelector } from '../../store';

interface Props {
  onSubmit: (text: string) => void;
  retryCount: number;
}

export function DetailCardEditing({ onSubmit, retryCount }: Props) {
  const { currentText, originalText } = useAppSelector(s => s.detailCard);
  const [value, setValue] = useState(currentText);

  const tooManyEdits = retryCount >= 4;

  return (
    <div className="flex flex-col gap-4 py-6 px-2">
      {tooManyEdits && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center"
          style={{ background: '#FEF3C7', color: '#92400E', fontFamily: 'Inter, sans-serif' }}
        >
          Too many edits — reverting to original selection.
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#718096' }}>
          Edit your selection
        </label>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={tooManyEdits}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl text-sm border outline-none resize-none transition-all focus:ring-2"
          style={{
            border: '2px solid #E2E8F0',
            fontFamily: 'Inter, sans-serif',
            color: '#1A202C',
          }}
        />
      </div>
      <button
        onClick={() => onSubmit(tooManyEdits ? originalText : value)}
        className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
      >
        Done
      </button>
    </div>
  );
}
