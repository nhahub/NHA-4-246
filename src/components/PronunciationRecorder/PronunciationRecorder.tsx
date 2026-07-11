import React, { useState, useRef, useCallback } from 'react';
import { assessPronunciation } from '../../services/api/mockApi';
import { PronunciationResult } from '../../services/api/types';
import { LevelMeter } from './LevelMeter';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  word: string;
  targetLang: string;
  onResult?: (result: PronunciationResult) => void;
}

type RecorderState = 'idle' | 'requesting' | 'ready' | 'recording' | 'assessing' | 'result' | 'denied' | 'error';

export function PronunciationRecorder({ word, targetLang, onResult }: Props) {
  const [state, setState] = useState<RecorderState>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const requestMic = useCallback(async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      setState('ready');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setState('denied');
      } else {
        setState('error');
        setError('Could not access microphone. Please check your device settings.');
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      setState('assessing');
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      try {
        const res = await assessPronunciation({ audioBlob: blob, word, targetLang });
        setResult(res);
        setState('result');
        onResult?.(res);
      } catch (err) {
        setState('error');
        setError('Assessment failed. Please try again.');
      }
    };

    mr.start();
    setState('recording');
  }, [word, targetLang, onResult]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setState('ready');
  }, []);

  const statusColor = (status: 'excellent' | 'good' | 'wrong') => {
    if (status === 'excellent') return { bg: '#D1FAE5', text: '#065F46' };
    if (status === 'good') return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (state === 'denied') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center px-4">
        <span className="text-4xl">🎤</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1A202C' }}>Microphone access denied</p>
          <p className="mt-1 text-xs" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
            Please enable microphone access in your browser settings to use pronunciation features.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center px-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm" style={{ color: '#991B1B', fontFamily: 'Inter, sans-serif' }}>
          {error || 'Something went wrong.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: '#153C70' }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (state === 'assessing') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <LoadingSpinner label="Analyzing pronunciation..." />
      </div>
    );
  }

  if (state === 'result' && result) {
    const scoreColor = result.score >= 80 ? '#065F46' : result.score >= 50 ? '#92400E' : '#991B1B';
    const scoreBg = result.score >= 80 ? '#D1FAE5' : result.score >= 50 ? '#FEF3C7' : '#FEE2E2';
    return (
      <div className="flex flex-col gap-4">
        {/* Score */}
        <div className="flex flex-col items-center gap-2 py-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: scoreBg, color: scoreColor, fontFamily: 'Poppins, sans-serif' }}
          >
            {result.score}
          </div>
          <p className="text-sm font-medium" style={{ color: '#1A202C' }}>
            {result.score >= 80 ? 'Excellent! 🎉' : result.score >= 50 ? 'Getting there 👍' : 'Keep practicing 💪'}
          </p>
        </div>

        {/* Phoneme breakdown */}
        {result.phonemeBreakdown.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#F4F7FB', border: '1px solid #E2E8F0' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#153C70' }}>Phoneme breakdown</p>
            <div className="flex flex-wrap gap-2">
              {result.phonemeBreakdown.map((ph, i) => {
                const c = statusColor(ph.status);
                return (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {ph.phoneme}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={reset}
          className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Idle / ready / recording states ─────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Word display */}
      <div className="text-center">
        <p className="text-xs" style={{ color: '#718096' }}>Pronounce</p>
        <p className="text-2xl font-bold mt-1" style={{ color: '#153C70', fontFamily: 'Poppins, sans-serif' }}>
          {word}
        </p>
      </div>

      {/* Level meter */}
      <div className="h-12 flex items-center justify-center">
        {state === 'recording' ? (
          <LevelMeter analyserNode={analyserNode} isRecording={state === 'recording'} />
        ) : (
          <div className="flex items-center gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 rounded-full"
                style={{ height: 8 + Math.sin(i * 0.9) * 6, backgroundColor: '#E2E8F0' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Record button */}
      {state === 'idle' && (
        <button
          onClick={requestMic}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#153C70', color: 'white' }}
          aria-label="Start recording"
        >
          🎤
        </button>
      )}

      {state === 'requesting' && (
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner label="Requesting mic access..." />
        </div>
      )}

      {state === 'ready' && (
        <button
          onClick={startRecording}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#153C70', color: 'white' }}
          aria-label="Start recording"
        >
          🎤
        </button>
      )}

      {state === 'recording' && (
        <button
          onClick={stopRecording}
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 record-pulse"
          style={{ backgroundColor: '#DC2626', color: 'white' }}
          aria-label="Stop recording"
        >
          <span className="w-7 h-7 rounded-sm bg-white" />
        </button>
      )}

      <p className="text-xs text-center" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
        {state === 'idle' && 'Tap the mic to enable recording'}
        {state === 'requesting' && 'Allow microphone access…'}
        {state === 'ready' && 'Tap to start recording'}
        {state === 'recording' && 'Recording… tap to stop'}
      </p>
    </div>
  );
}
