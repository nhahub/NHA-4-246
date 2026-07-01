import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadWordForPhoneme, resetAssessment, setActivePhoneme } from '../../store/pronounceSlice';
import { PronunciationRecorder } from '../../components/PronunciationRecorder/PronunciationRecorder';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function PhonemeAssessmentPage() {
  const { phonemeId } = useParams<{ phonemeId: string }>();
  const phoneme = phonemeId ? decodeURIComponent(phonemeId) : '';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { activePhoneme, mode, currentWord, wordLoading, assessmentResult } = useAppSelector(s => s.pronounce);
  const { targetLanguage } = useAppSelector(s => s.user);

  useEffect(() => {
    if (phoneme && activePhoneme !== phoneme) {
      dispatch(setActivePhoneme(phoneme));
    }
  }, [phoneme, activePhoneme, dispatch]);

  const wordToPractice = mode === 'word' ? currentWord : null;
  const displayWord = wordToPractice || phoneme;

  const handlePronounceInWord = () => {
    dispatch(resetAssessment());
    dispatch(loadWordForPhoneme(phoneme));
  };

  const handleAgain = () => {
    dispatch(resetAssessment());
  };

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pronounce')}
            aria-label="Back to phonemes"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Phoneme: {phoneme}
            </h1>
            <p className="text-white/60 text-xs">
              {mode === 'word' && currentWord
                ? `Practicing in word: "${currentWord}"`
                : 'Isolated phoneme practice'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-5">
        {wordLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner label="Finding a word…" />
          </div>
        )}

        {!wordLoading && (
          <div
            className="rounded-3xl p-6 shadow-sm"
            style={{ backgroundColor: 'white', border: '2px solid #E2E8F0' }}
          >
            <PronunciationRecorder
              word={displayWord}
              targetLang={targetLanguage}
            />
          </div>
        )}

        {/* Action buttons (shown after a result is available) */}
        {assessmentResult && (
          <div className="flex gap-3">
            <button
              onClick={handleAgain}
              className="flex-1 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#F4F7FB', color: '#153C70', border: '2px solid #E2E8F0', fontFamily: 'Poppins, sans-serif' }}
            >
              🔁 Again
            </button>
            <button
              onClick={handlePronounceInWord}
              disabled={wordLoading}
              className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
            >
              {mode === 'word'
                ? '🔄 Another word'
                : '📝 In a word'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
