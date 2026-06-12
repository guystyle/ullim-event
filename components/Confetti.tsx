"use client";

import { useEffect, useRef } from "react";

// ullim Design System 팔레트 기반
const COLORS = ["#2C7A7B", "#C2B280", "#FFF4C2", "#1A2B3C", "#B29588", "#F5F5DC"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
}

/** 당첨 시 화면 전체에 종이 꽃가루를 뿌리는 캔버스 이펙트. */
export default function Confetti({ duration = 3600 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    const spawn = (cx: number, count: number) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 60 * dpr,
          y: canvas.height * 0.4,
          vx: (Math.random() - 0.5) * 16 * dpr,
          vy: -(7 + Math.random() * 10) * dpr,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          w: (6 + Math.random() * 6) * dpr,
          h: (8 + Math.random() * 8) * dpr,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    spawn(canvas.width * 0.5, 90);
    const burst2 = setTimeout(() => spawn(canvas.width * 0.25, 55), 350);
    const burst3 = setTimeout(() => spawn(canvas.width * 0.75, 55), 650);

    const gravity = 0.34 * dpr;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.vy += gravity;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // 회전에 따라 폭이 변해 팔랑이는 느낌
        const flutter = Math.sin(p.rot * 3) * 0.6 + 0.4;
        ctx.fillStyle = p.color;
        ctx.fillRect((-p.w * flutter) / 2, -p.h / 2, p.w * flutter, p.h);
        ctx.restore();
      }
      if (now - start < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(burst2);
      clearTimeout(burst3);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden />;
}
