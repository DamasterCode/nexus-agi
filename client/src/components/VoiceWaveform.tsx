import { useEffect, useRef } from "react";

interface VoiceWaveformProps {
  isListening: boolean;
  isSpeaking?: boolean;
  color?: string;
  height?: number;
  barCount?: number;
}

export default function VoiceWaveform({
  isListening,
  isSpeaking = false,
  color = "#00d4ff",
  height = 40,
  barCount = 20,
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);

  // Initialize bars
  useEffect(() => {
    barsRef.current = new Array(barCount).fill(0);
  }, [barCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = barsRef.current;
      const barWidth = canvas.width / bars.length;

      for (let i = 0; i < bars.length; i++) {
        // Animate bars
        if (isListening || isSpeaking) {
          bars[i] = Math.random() * 0.8 + 0.2;
        } else {
          bars[i] *= 0.95; // Decay
        }

        const barHeight = bars[i] * height;
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color + "80");
        gradient.addColorStop(0.5, color + "ff");
        gradient.addColorStop(1, color + "80");

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

        // Draw border
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking, color, height]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full rounded-lg bg-void-3 border border-cyan-400/20"
    />
  );
}
