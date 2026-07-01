import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadVaultWords, generateParagraph, resetReadSession } from '../../store/vaultSlice';
import { useDetailCardFlow } from '../../components/DetailCard/useDetailCardFlow';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

/** Renders paragraph text with picked words visually highlighted */
function HighlightedParagraph({
  paragraph,
  pickedWordIds,
  words,
  onWordClick,
}: {
  paragraph: string;
  pickedWordIds: string[];
  words: { id: string; headword: string }[];
  onWordClick: (word: string) => void;
}) {
  const pickedWords = words.filter(w => pickedWordIds.includes(w.id)).map(w => w.headword);

  if (pickedWords.length === 0) {
    return (
      <p className="text-base leading-relaxed" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
        {paragraph}
      </p>
    );
  }

  // Build regex from all picked words
  const pattern = new RegExp(`(${pickedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = paragraph.split(pattern);

  return (
    <p className="text-base leading-relaxed" style={{ color: '#1A202C', fontFamily: 'Inter, sans-serif' }}>
      {parts.map((part, i) => {
        const isHighlighted = pickedWords.some(w => w.toLowerCase() === part.toLowerCase());
        return isHighlighted ? (
          <button
            key={i}
            onClick={() => onWordClick(part)}
            className="font-bold underline decoration-dotted transition-colors hover:text-blue-700"
            style={{ color: '#153C70', textDecorationColor: '#153C70', background: 'none', cursor: 'pointer' }}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

export default function VaultReadPage() {
  const { month } = useParams<{ month: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { wordsByMonth, currentReadSession } = useAppSelector(s => s.vault);
  const { triggerCardOpen } = useDetailCardFlow();

  const words = month ? (wordsByMonth[month] || []) : [];
  const { paragraph, pickedWordIds, generating, error } = currentReadSession;

  // Load words if not cached
  useEffect(() => {
    if (month && !wordsByMonth[month]) {
      dispatch(loadVaultWords(month));
    }
  }, [dispatch, month, wordsByMonth]);

  // Generate on mount
  useEffect(() => {
    if (month && !paragraph && !generating) {
      dispatch(generateParagraph({ month, excludeWordIds: [] }));
    }
  }, [dispatch, month]);

  // Reset session on unmount
  useEffect(() => () => { dispatch(resetReadSession()); }, [dispatch]);

  const handleGenerateAnother = useCallback(() => {
    if (!month) return;
    dispatch(generateParagraph({ month, excludeWordIds: pickedWordIds }));
  }, [dispatch, month, pickedWordIds]);

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/vault/${month}`)}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              📖 Reading Practice
            </h1>
            <p className="text-white/60 text-xs">Tap highlighted words to review them</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-5">
        {generating && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" label="Generating paragraph…" />
          </div>
        )}

        {!generating && error && (
          <div className="rounded-2xl p-5 text-center" style={{ border: '2px solid #FEE2E2', backgroundColor: '#FFF5F5' }}>
            <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
              Couldn't generate a paragraph, try again.
            </p>
            <button
              onClick={handleGenerateAnother}
              className="mt-3 px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: '#153C70' }}
            >
              Try again
            </button>
          </div>
        )}

        {!generating && paragraph && (
          <>
            <div
              className="rounded-3xl p-6 shadow-sm"
              style={{ backgroundColor: 'white', border: '2px solid #E2E8F0' }}
            >
              <HighlightedParagraph
                paragraph={paragraph}
                pickedWordIds={pickedWordIds}
                words={words}
                onWordClick={triggerCardOpen}
              />
            </div>

            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: '#F4F7FB', border: '1px solid #E2E8F0' }}
            >
              <span className="text-2xl">💡</span>
              <p className="text-xs flex-1" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
                Highlighted words are from your vault. Tap to review their full definition.
              </p>
            </div>

            <button
              onClick={handleGenerateAnother}
              disabled={generating}
              className="w-full py-4 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
            >
              ✨ Generate another paragraph
            </button>
          </>
        )}
      </div>
    </div>
  );
}
