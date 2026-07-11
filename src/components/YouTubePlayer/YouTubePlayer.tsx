import React, { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  videoId: string;
  onPause?: () => void;
  onPlay?: () => void;
  onTimeUpdate?: (time: number) => void;
  /** Called whenever the user clicks the video area to toggle play/pause. */
  onTogglePlay?: () => void;
  /**
   * Optional ref that will be populated with the togglePlay function once
   * the player is mounted. Use this to imperatively toggle playback from
   * outside the component (e.g. from a sibling CaptionBox).
   */
  togglePlayRef?: React.MutableRefObject<() => void>;
}

let apiLoaded = false;
let apiCallbacks: (() => void)[] = [];

function loadYouTubeApi(): Promise<void> {
  return new Promise(resolve => {
    if (apiLoaded) { resolve(); return; }
    apiCallbacks.push(resolve);
    if (document.getElementById('yt-iframe-api')) return;
    const script = document.createElement('script');
    script.id = 'yt-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiCallbacks.forEach(cb => cb());
      apiCallbacks = [];
    };
  });
}

export function YouTubePlayer({ videoId, onPause, onPlay, onTimeUpdate, onTogglePlay, togglePlayRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const timeIntervalRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    loadYouTubeApi().then(() => {
      if (!mounted || !containerRef.current) return;
      const divId = `yt-player-${videoId}`;
      const div = document.createElement('div');
      div.id = divId;
      containerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(divId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, controls: 0 },
        events: {
          onReady: () => {
            if (!mounted) return;
            setPlayerReady(true);
            setDuration(playerRef.current?.getDuration() || 0);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (!mounted) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlay?.();
              timeIntervalRef.current = window.setInterval(() => {
                const t = playerRef.current?.getCurrentTime() || 0;
                setCurrentTime(t);
                onTimeUpdate?.(t);
              }, 500);
            } else {
              setIsPlaying(false);
              if (event.data === window.YT.PlayerState.PAUSED) onPause?.();
              clearInterval(timeIntervalRef.current);
            }
          },
        },
      });
    });
    return () => {
      mounted = false;
      clearInterval(timeIntervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
    onTogglePlay?.();
  }, [isPlaying, onTogglePlay]);

  // Populate the external ref so sibling components (e.g. CaptionBox) can
  // call togglePlay without needing the player ref themselves.
  if (togglePlayRef) togglePlayRef.current = togglePlay;

  const seek = useCallback((val: number) => {
    playerRef.current?.seekTo(val, true);
    setCurrentTime(val);
  }, []);

  const changeVolume = useCallback((val: number) => {
    playerRef.current?.setVolume(val);
    setVolume(val);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-lg" style={{ border: '2px solid #E2E8F0' }}>
      {/* Video — 16:9 aspect-ratio wrapper.
          The YouTube IFrame API appends the iframe as a child element with
          width/height attributes set to '100%'. For those percentages to
          resolve correctly the iframe must be absolutely positioned inside a
          relatively-positioned container that has actual dimensions.
          Using paddingBottom:56.25% + height:0 on the outer div gives the
          container its height; the inner div stretches to fill it absolutely,
          and the YouTube API-created iframe inherits its full size.
          A transparent click-catcher sits on top so clicking the video area
          calls togglePlay without intercepting the iframe's own events. */}
      <div className="relative bg-black" style={{ paddingBottom: '56.25%', height: 0 }}>
        {/* Inner div: fills the padding-box absolutely so the iframe has a
            real pixel height to inherit from via height:'100%' */}
        <div
          ref={containerRef}
          className="absolute inset-0"
        />
        {/* Transparent click-catcher — sits above the iframe, passes visual
            content through (no background), but captures pointer events so
            clicking the video area toggles play/pause. */}
        {playerReady && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            role="button"
            tabIndex={-1}
          />
        )}
      </div>

      {/* Custom controls */}
      {playerReady && (
        <div className="px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: '#0E2954' }}>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 font-mono w-10 text-right">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={e => seek(Number(e.target.value))}
              className="flex-1 h-1 accent-blue-400 cursor-pointer"
              aria-label="Seek"
            />
            <span className="text-xs text-white/70 font-mono w-10">{fmt(duration)}</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:bg-white/20"
              style={{ color: 'white' }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">🔊</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={e => changeVolume(Number(e.target.value))}
                className="w-20 h-1 accent-blue-400 cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* YouTube link */}
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              YT ↗
            </a>
          </div>
        </div>
      )}

      {!playerReady && (
        <div className="flex items-center justify-center py-4" style={{ backgroundColor: '#0E2954' }}>
          <span className="text-xs text-white/60">Loading player…</span>
        </div>
      )}
    </div>
  );
}
