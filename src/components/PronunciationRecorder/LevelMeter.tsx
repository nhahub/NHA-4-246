import React, { useRef, useEffect, useCallback } from 'react';

interface Props {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
}

export function LevelMeter({ analyserNode, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    const avg = dataArray.slice(0, 20).reduce((s, v) => s + v, 0) / 20;
    const level = avg / 255;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barCount = 12;
    const barW = (canvas.width - (barCount - 1) * 3) / barCount;
    for (let i = 0; i < barCount; i++) {
      const height = Math.max(4, canvas.height * level * (0.4 + Math.random() * 0.6));
      const x = i * (barW + 3);
      const y = (canvas.height - height) / 2;
      ctx.fillStyle = level > 0.6 ? '#153C70' : level > 0.3 ? '#3B82F6' : '#93C5FD';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, height, 3);
      ctx.fill();
    }

    if (isRecording) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
  }, [analyserNode, isRecording]);

  useEffect(() => {
    if (isRecording && analyserNode) {
      animFrameRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, analyserNode, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={48}
      className="rounded-xl"
      aria-hidden="true"
    />
  );
}
