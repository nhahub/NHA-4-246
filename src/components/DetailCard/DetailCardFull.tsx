import React, { useState } from 'react';
import { DetailCardData } from '../../services/api/types';
import { SaveButton } from './SaveButton';
import { useAppDispatch, useAppSelector } from '../../store';
import { setMode, toggleTranslations } from '../../store/detailCardSlice';
import { translateExplanations } from '../../services/api/mockApi';

interface Props {
  card: DetailCardData;
  source?: 'watch' | 'explore' | 'selection' | 'manual';
}

/** Renders the example sentence with _headword_ bolded */
function ExampleSentence({ text }: { text: string }) {
  const parts = text.split(/_([^_]+)_/g);
  return (
    <p className="mt-1.5 text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ color: '#1A202C' }}>{part}</strong>
          : part
      )}
    </p>
  );
}

export function DetailCardFull({ card, source }: Props) {
  const dispatch = useAppDispatch();
  const { translationsVisible } = useAppSelector(s => s.detailCard);
  const { nativeLanguage, targetLanguage } = useAppSelector(s => s.user);
  const [translations, setTranslations] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const showTranslateIcon = nativeLanguage !== targetLanguage;

  const handleTranslate = async () => {
    dispatch(toggleTranslations());
    if (!translationsVisible && translations.length === 0) {
      setTranslating(true);
      try {
        const result = await translateExplanations({
          explanations: card.contexts.map(c => c.explanation),
          nativeLang: nativeLanguage,
        });
        setTranslations(result.translated);
      } finally {
        setTranslating(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h2
            className="text-2xl font-bold leading-tight"
            style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}
          >
            {card.headword}
          </h2>
          {card.synonyms.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
              {card.synonyms.join(' · ')}
            </p>
          )}
        </div>
        {showTranslateIcon && (
          <button
            onClick={handleTranslate}
            title="Toggle translated explanations"
            aria-label="Toggle translated explanations"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
            style={{
              backgroundColor: translationsVisible ? '#153C70' : '#F4F7FB',
              color: translationsVisible ? 'white' : '#153C70',
            }}
          >
            🌐
          </button>
        )}
      </div>

      {/* Context blocks */}
      <div className="flex flex-col gap-4">
        {card.contexts.map((ctx, i) => (
          <div
            key={i}
            className="rounded-2xl px-4 py-3"
            style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#153C70' }}>
              Context: {ctx.label}
            </p>
            <p className="text-sm font-medium italic" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
              {translationsVisible && translations[i] ? translations[i] : ctx.explanation}
              {translating && translationsVisible && !translations[i] && (
                <span className="ml-1 text-xs" style={{ color: '#718096' }}>translating…</span>
              )}
            </p>
            <ExampleSentence text={ctx.example} />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={() => dispatch(setMode('watch'))}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#F4F7FB', color: '#153C70', fontFamily: 'Poppins, sans-serif', border: '2px solid #E2E8F0' }}
        >
          ▶ Watch
        </button>
        <button
          onClick={() => dispatch(setMode('pronounce'))}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#F4F7FB', color: '#153C70', fontFamily: 'Poppins, sans-serif', border: '2px solid #E2E8F0' }}
        >
          🎤 Pronounce
        </button>
        <SaveButton card={card} source={source} />
      </div>
    </div>
  );
}
