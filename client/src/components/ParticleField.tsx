/* ParticleField.tsx
   Design: Cyberpunk Minimalism — floating circuit node particles on void background
*/
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.4 + 0.15),
      size: Math.random() * 1.5 + 0.5,
      opacity: 0,
      life: 0,
      maxLife: Math.random() * 300 + 200,
    });

    // Pre-populate
    for (let i = 0; i < 30; i++) {
      const p = spawnParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particles.length < 60 && Math.random() < 0.3) {
        particles.push(spawnParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        if (progress < 0.1) {
          p.opacity = progress / 0.1;
        } else if (progress > 0.8) {
          p.opacity = (1 - progress) / 0.2;
        } else {
          p.opacity = 0.6;
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity * 0.7;
        ctx.fillStyle = "#00b4ff";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#00b4ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  );
}
