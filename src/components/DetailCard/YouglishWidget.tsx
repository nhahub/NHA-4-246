import React, { useEffect, useRef, useState, useId } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

// ─── YouGlish JS API type declarations ────────────────────────────────────────
declare global {
  interface Window {
    YG: {
      Widget: new (
        containerId: string,
        options: YouglishWidgetOptions
      ) => YouglishWidgetInstance;
    };
    onYouglishAPIReady: () => void;
  }
}

interface YouglishWidgetOptions {
  components?: number;
  autoStart?: number;
  linkColor?: string;
  backgroundColor?: string;
  captionColor?: string;
  queryColor?: string;
  events?: {
    onFetchDone?: (event: { totalResult: number }) => void;
    onVideoChange?: (event: { trackNumber: number }) => void;
    onCaptionConsumed?: () => void;
  };
}

interface YouglishWidgetInstance {
  fetch: (query: string, lang: string) => void;
  pause: () => void;
  play: () => void;
  next: () => void;
  previous: () => void;
  replay: () => void;
}

// ─── Lazy SDK loader (singleton, mirrors YouTubePlayer pattern) ────────────────
let sdkLoaded = false;
let sdkCallbacks: (() => void)[] = [];

function loadYouglishSdk(): Promise<void> {
  return new Promise(resolve => {
    if (sdkLoaded) { resolve(); return; }
    sdkCallbacks.push(resolve);
    if (document.getElementById('youglish-sdk')) return;

    // Register the global callback BEFORE injecting the script tag
    window.onYouglishAPIReady = () => {
      sdkLoaded = true;
      sdkCallbacks.forEach(cb => cb());
      sdkCallbacks = [];
    };

    const script = document.createElement('script');
    script.id = 'youglish-sdk';
    script.src = 'https://youglish.com/public/emb/widget.js';
    script.async = true;
    document.head.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** The headword or phrase to look up */
  word: string;
  /**
   * Full language name as stored in Redux (e.g. "English", "French").
   * These match YouGlish's fetch() lang parameter exactly.
   */
  language: string;
}

/**
 * YouglishWidget — wraps the official YouGlish JS Widget API.
 *
 * - Loads the SDK lazily on first mount (singleton script tag).
 * - Creates one widget instance per mount with a unique container ID
 *   to avoid conflicts when the card is closed and re-opened.
 * - Pauses + nulls the instance on unmount (no leak).
 * - Shows a loading spinner while the SDK or first fetch is pending.
 * - Shows an EmptyState when YouGlish returns 0 results.
 */
export function YouglishWidget({ word, language }: Props) {
  // React 18 useId gives a stable unique ID safe for DOM use
  const uid = useId().replace(/:/g, '');
  const containerId = `youglish-widget-${uid}`;

  const widgetRef = useRef<YouglishWidgetInstance | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    loadYouglishSdk()
      .then(() => {
        if (!mounted) return;
        if (!window.YG?.Widget) {
          setPhase('error');
          return;
        }

        try {
          widgetRef.current = new window.YG.Widget(containerId, {
            // 4 (Title) + 8 (Caption) + 16 (Speed) + 64 (Control Buttons) = 92
            // Omit 1 (Search box) — the word is pre-supplied programmatically.
            components: 92,
            autoStart: 1,
            backgroundColor: '#FFFFFF',
            linkColor: '#153C70',
            captionColor: '#153C70',
            queryColor: '#153C70',
            events: {
              onFetchDone: (event) => {
                if (!mounted) return;
                if (event.totalResult === 0) {
                  setPhase('empty');
                } else {
                  setPhase('ready');
                }
              },
            },
          });

          widgetRef.current.fetch(word, language);
        } catch {
          if (mounted) setPhase('error');
        }
      })
      .catch(() => {
        if (mounted) setPhase('error');
      });

    return () => {
      mounted = false;
      try {
        widgetRef.current?.pause();
      } catch {
        // widget may already be torn down by the SDK; safe to ignore
      }
      widgetRef.current = null;
    };
  }, [word, language, containerId]);

  return (
    <div>
      {/* Loading skeleton — visible until onFetchDone fires */}
      {phase === 'loading' && (
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ minHeight: 200, border: '2px solid #E2E8F0', backgroundColor: '#F4F7FB' }}
        >
          <LoadingSpinner label="Loading pronunciation clips…" />
        </div>
      )}

      {/* Empty state */}
      {phase === 'empty' && (
        <EmptyState
          icon="🔇"
          title="No videos found"
          message={`No pronunciation videos found for "${word}".`}
        />
      )}

      {/* Error state */}
      {phase === 'error' && (
        <EmptyState
          icon="⚠️"
          title="Widget unavailable"
          message="Could not load pronunciation clips. Please check your connection and try again."
        />
      )}

      {/*
        The widget SDK replaces this div with its iframe.
        Always rendered so the SDK has a DOM target from the start,
        but visually hidden while loading/empty/error to avoid flash.
      */}
      <div
        id={containerId}
        className="rounded-2xl overflow-hidden"
        style={{
          border: phase === 'ready' ? '2px solid #E2E8F0' : 'none',
          display: phase === 'ready' ? 'block' : 'none',
        }}
      />
    </div>
  );
}
