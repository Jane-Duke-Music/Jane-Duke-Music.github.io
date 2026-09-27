import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useTheme } from '../context/ThemeContext';

export const AudioVisualizer: React.FC<{ height?: number; className?: string }> = ({
  height = 40,
  className = '',
}) => {
  const { audioAnalyser, isPlaying } = useAudioPlayer();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (theme.visualizerType === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameIdRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (!audioAnalyser || !isPlaying) {
        // Subtle ambient idle pulse
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
        const bars = 16;
        const barWidth = width / bars - 2;
        for (let i = 0; i < bars; i++) {
          const barHeight = 4 + Math.sin(Date.now() / 400 + i) * 3;
          ctx.fillRect(i * (barWidth + 2), h - barHeight, barWidth, barHeight);
        }
        return;
      }

      const bufferLength = audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioAnalyser.getByteFrequencyData(dataArray);

      if (theme.visualizerType === 'wave') {
        // Glowing gold wave
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.accentColor || '#d4af37';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(247, 183, 46, 0.8)';

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();
      } else {
        // Gothic frequency bars
        const bars = 24;
        const barWidth = Math.max(2, (width / bars) - 2);

        for (let i = 0; i < bars; i++) {
          const index = Math.floor((i / bars) * bufferLength);
          const value = dataArray[index] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * h);

          // Gradient from gold to wine
          const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
          gradient.addColorStop(0, '#5c1f1f');
          gradient.addColorStop(0.5, theme.accentColor || '#d4af37');
          gradient.addColorStop(1, '#ffd700');

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
          ctx.fillRect(i * (barWidth + 2), h - barHeight, barWidth, barHeight);
        }
      }
    };

    render();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [audioAnalyser, isPlaying, theme]);

  if (theme.visualizerType === 'off') return null;

  return (
    <div className={`overflow-hidden flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={160}
        height={height}
        className="w-full max-w-[160px] h-[40px]"
      />
    </div>
  );
};
