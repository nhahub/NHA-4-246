import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setMode } from '../../store/detailCardSlice';
import { getYouglishVideo } from '../../services/api/mockApi';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function DetailCardWatchView() {
  const dispatch = useAppDispatch();
  const { card } = useAppSelector(s => s.detailCard);
  const [videoUrl, setVideoUrl] = useState<string | null | undefined>(undefined); // undefined = loading
  const { targetLanguage } = useAppSelector(s => s.user);

  useEffect(() => {
    if (!card) return;
    getYouglishVideo({ word: card.headword, targetLang: targetLanguage })
      .then(r => setVideoUrl(r.videoUrl))
      .catch(() => setVideoUrl(null));
  }, [card, targetLanguage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(setMode('full'))}
          aria-label="Back to card"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80"
          style={{ backgroundColor: '#F4F7FB', color: '#153C70' }}
        >
          ←
        </button>
        <span className="font-semibold text-sm" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
          Watch: <em>{card?.headword}</em>
        </span>
      </div>

      {videoUrl === undefined && (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="Finding video..." />
        </div>
      )}

      {videoUrl === null && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-4xl">🎬</span>
          <p className="text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
            No pronunciation videos found for this phrase.
          </p>
        </div>
      )}

      {videoUrl && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #E2E8F0' }}>
          <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={videoUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Watch ${card?.headword}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
