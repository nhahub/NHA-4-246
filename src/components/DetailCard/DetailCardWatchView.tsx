import React from 'react';
import { DetailCardData } from '../../services/api/types';
import { YouglishWidget } from './YouglishWidget';

interface Props {
  card: DetailCardData;
  targetLanguage: string;
  onBack: () => void;
}

export function DetailCardWatchView({ card, targetLanguage, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Back to card"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80"
          style={{ backgroundColor: '#F4F7FB', color: '#153C70' }}
        >
          ←
        </button>
        <span className="font-semibold text-sm" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
          Watch: <em>{card.headword}</em>
        </span>
      </div>

      <YouglishWidget word={card.headword} language={targetLanguage} />
    </div>
  );
}
