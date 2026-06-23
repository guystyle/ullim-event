"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#2C7A7B", "#C2B280", "#FFF4C2", "#1A2B3C", "#B29588", "#F5F5DC", "#FFD700", "#FFFFFF"];

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
  opacity: number;
  type: "rect" | "circle" | "star";
  life: number;
  maxLife: number;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

function ConfettiCanvas({ duration = 5000 }: { duration?: number }) {
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
    const types: Particle["type"][] = ["rect", "rect", "rect", "circle", "star"];

    const spawn = (cx: number, cy: number, count: number, spread: number, power: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (3 + Math.random() * power) * dpr;
        const maxLife = 120 + Math.random() * 80;
        particles.push({
          x: cx + (Math.random() - 0.5) * spread * dpr,
          y: cy + (Math.random() - 0.5) * spread * 0.3 * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4 * dpr,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.4,
          w: (5 + Math.random() * 8) * dpr,
          h: (7 + Math.random() * 10) * dpr,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 1,
          type: types[Math.floor(Math.random() * types.length)],
          life: 0,
          maxLife,
        });
      }
    };

    const burstFromTop = (count: number) => {
      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const maxLife = 140 + Math.random() * 60;
        particles.push({
          x,
          y: -10 * dpr,
          vx: (Math.random() - 0.5) * 6 * dpr,
          vy: (2 + Math.random() * 5) * dpr,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          w: (5 + Math.random() * 7) * dpr,
          h: (7 + Math.random() * 9) * dpr,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 1,
          type: types[Math.floor(Math.random() * types.length)],
          life: 0,
          maxLife,
        });
      }
    };

    spawn(canvas.width * 0.5, canvas.height * 0.35, 150, 80, 14);
    const t1 = setTimeout(() => {
      spawn(canvas.width * 0.2, canvas.height * 0.3, 80, 60, 12);
      spawn(canvas.width * 0.8, canvas.height * 0.3, 80, 60, 12);
    }, 300);
    const t2 = setTimeout(() => burstFromTop(120), 600);
    const t3 = setTimeout(() => spawn(canvas.width * 0.5, canvas.height * 0.4, 100, 120, 10), 1000);
    const t4 = setTimeout(() => {
      spawn(canvas.width * 0.15, canvas.height * 0.5, 60, 40, 11);
      spawn(canvas.width * 0.85, canvas.height * 0.5, 60, 40, 11);
      burstFromTop(80);
    }, 1600);

    const gravity = 0.25 * dpr;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.vy += gravity;
        p.vx *= 0.993;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const lifeRatio = p.life / p.maxLife;
        p.opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;

        if (p.opacity <= 0 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        const flutter = Math.sin(p.rot * 3 + p.life * 0.1) * 0.6 + 0.4;
        ctx.fillStyle = p.color;

        if (p.type === "rect") {
          ctx.fillRect((-p.w * flutter) / 2, -p.h / 2, p.w * flutter, p.h);
        } else if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.w * 0.5);
        }

        ctx.restore();
      }

      if (elapsed < duration || particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden />;
}

export default function Confetti({ duration = 5000 }: { duration?: number }) {
  return createPortal(<ConfettiCanvas duration={duration} />, document.body);
}
