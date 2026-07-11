import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadPhonemes, setActivePhoneme } from '../../store/pronounceSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const STATUS_LABELS = {
  excellent: { label: 'Excellent', bg: '#D1FAE5', text: '#065F46' },
  good:      { label: 'Good',      bg: '#FEF3C7', text: '#92400E' },
  wrong:     { label: 'Needs work', bg: '#FEE2E2', text: '#991B1B' },
};

export default function PronouncePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { phonemes, phonemesLoading } = useAppSelector(s => s.pronounce);

  useEffect(() => {
    dispatch(loadPhonemes());
  }, [dispatch]);

  const handlePhoneme = (phoneme: string) => {
    const encoded = encodeURIComponent(phoneme);
    dispatch(setActivePhoneme(phoneme));
    navigate(`/pronounce/${encoded}`);
  };

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          🎤 Pronounce
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Practice phonemes — tap one to start an assessment
        </p>
      </div>

      <div className="px-6 pt-5">
        {phonemesLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label="Loading phonemes…" />
          </div>
        ) : (
          <>
            {/* Status legend */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map(k => (
                <span
                  key={k}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: STATUS_LABELS[k].bg, color: STATUS_LABELS[k].text }}
                >
                  {STATUS_LABELS[k].label}
                </span>
              ))}
            </div>

            {/* Phoneme grid */}
            <div className="grid grid-cols-3 gap-3">
              {phonemes.map(ph => {
                const s = STATUS_LABELS[ph.status];
                return (
                  <button
                    key={ph.phoneme}
                    onClick={() => handlePhoneme(ph.phoneme)}
                    className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-2xl transition-all hover:shadow-md active:scale-95"
                    style={{
                      backgroundColor: s.bg,
                      border: `2px solid ${s.text}20`,
                    }}
                    aria-label={`Practice phoneme ${ph.phoneme}, status: ${ph.status}`}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#0E2954', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {ph.phoneme}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: s.text + '20', color: s.text }}
                    >
                      {ph.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
