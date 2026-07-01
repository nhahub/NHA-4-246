import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadCaptions, clearSession } from '../../store/watchSlice';
import { YouTubePlayer } from '../../components/YouTubePlayer/YouTubePlayer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useDetailCardFlow } from '../../components/DetailCard/useDetailCardFlow';
import { showBeeIcon } from '../../store/uiSlice';

function CaptionBox({ captions, currentTimeMs, onPause }: {
  captions: { startMs: number; endMs: number; text: string }[];
  currentTimeMs: number;
  onPause: () => void;
}) {
  const dispatch = useAppDispatch();
  const { triggerCardOpen } = useDetailCardFlow();
  const activeLine = captions.find(c => currentTimeMs >= c.startMs && currentTimeMs <= c.endMs);

  const handleCaptionMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && text.length > 1) {
      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      dispatch(showBeeIcon({ text, x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8 }));
    }
  };

  return (
    <div
      className="rounded-2xl p-4 select-text"
      style={{ backgroundColor: 'white', border: '2px solid #E2E8F0', minHeight: 100 }}
      onClick={onPause}
      onMouseUp={handleCaptionMouseUp}
    >
      <p className="text-xs font-semibold mb-3" style={{ color: '#718096' }}>Captions (tap to pause, select text for bee icon)</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {captions.map((line, i) => {
          const isActive = currentTimeMs >= line.startMs && currentTimeMs <= line.endMs;
          return (
            <p
              key={i}
              className="text-sm transition-all leading-relaxed"
              style={{
                color: isActive ? '#1A202C' : '#718096',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'Inter, sans-serif',
                backgroundColor: isActive ? '#F4F7FB' : 'transparent',
                borderRadius: 8,
                padding: isActive ? '4px 8px' : '0 8px',
              }}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function WatchPlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { captions, captionsLoading, sessionSavedWords } = useAppSelector(s => s.watch);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const pauseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (videoId) dispatch(loadCaptions(videoId));
    return () => { dispatch(clearSession()); };
  }, [dispatch, videoId]);

  if (!videoId) return null;

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <button
          onClick={() => navigate('/watch')}
          aria-label="Back to Watch"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Now Watching
        </h1>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4">
        {/* YouTube Player */}
        <YouTubePlayer
          videoId={videoId}
          onTimeUpdate={t => setCurrentTimeMs(t * 1000)}
        />

        {/* Captions */}
        {captionsLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner label="Loading captions…" />
          </div>
        ) : (
          <CaptionBox
            captions={captions}
            currentTimeMs={currentTimeMs}
            onPause={() => { /* player handles its own pause */ }}
          />
        )}

        {/* Session saved words sidebar */}
        {sessionSavedWords.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#F4F7FB', border: '2px solid #E2E8F0' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#153C70' }}>
              🐝 Words saved this session ({sessionSavedWords.length})
            </p>
            <div className="flex flex-col gap-2">
              {sessionSavedWords.map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="font-semibold text-sm" style={{ color: '#1A202C' }}>{w.headword}</p>
                  <p className="text-xs" style={{ color: '#718096' }}>{w.nativeTranslation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
