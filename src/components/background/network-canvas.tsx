import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../../theme';

interface NetworkBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  color?: string;
  interactive?: boolean;
}

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  a: number;
  b: number;
  packetT: number;
  packetSpeed: number;
  packetDir: 1 | -1;
}

function createPoints(count: number, width: number, height: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const vx = (Math.random() - 0.5) * 0.05;
    const vy = (Math.random() - 0.5) * 0.05;
    points.push({ x, y, vx, vy });
  }
  return points;
}

function distance2(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function buildEdges(points: Point[], kNearest: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < points.length; i++) {
    const dists = points
      .map((p, idx) => ({ idx, d2: i === idx ? Infinity : distance2(points[i], p) }))
      .sort((a, b) => a.d2 - b.d2)
      .slice(0, kNearest);
    for (const { idx } of dists) {
      if (i < idx) {
        edges.push({
          a: i,
          b: idx,
          packetT: Math.random(),
          packetSpeed: 0.15 + Math.random() * 0.25,
          packetDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }
  }
  return edges;
}

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function NetworkBackground({ density = 'medium', color, interactive = false }: NetworkBackgroundProps) {
  const { themeName } = useTheme();
  const effectiveColor = useMemo(() => {
    if (color) return color;
    if (typeof document === 'undefined') return '#e9eef4';
    const value = getComputedStyle(document.documentElement).getPropertyValue('--theme-network-color').trim();
    return value || '#e9eef4';
  }, [color, themeName]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx0 = c.getContext('2d');
    if (!ctx0) return;
    const canvasEl = c as HTMLCanvasElement;
    const ctx = ctx0 as CanvasRenderingContext2D;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      const parent = canvasEl.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    }

    let points: Point[] = [];
    let edges: Edge[] = [];
    let lastTime = performance.now();
    let mouseX = -9999;
    let mouseY = -9999;

    function computeCount(): number {
      const area = width * height;
      const base = area / 28000; // ~ medium density
      const mult = density === 'low' ? 0.7 : density === 'high' ? 1.6 : 1;
      return Math.max(24, Math.min(140, Math.round(base * mult)));
    }

    function rebuild() {
      const count = computeCount();
      points = createPoints(count, width, height);
      edges = buildEdges(points, 3);
    }

    function step(now: number) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      draw(dt);
      rafId = requestAnimationFrame(step);
    }

    function draw(dt: number) {
      ctx.clearRect(0, 0, width, height);

      // Gentle drift
      if (!prefersReducedMotion) {
        for (const p of points) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          if (interactive && mouseX > -9990) {
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const d2 = dx * dx + dy * dy;
            if (d2 < 20000) {
              p.vx += (dx / 20000) * 0.5;
              p.vy += (dy / 20000) * 0.5;
            }
          }
        }
      }

      // Edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${effectiveColor}20`; // ~12.5% alpha
      ctx.beginPath();
      for (const e of edges) {
        const a = points[e.a];
        const b = points[e.b];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // Nodes
      ctx.fillStyle = `${effectiveColor}66`; // ~40% alpha
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Packets along edges
      if (!prefersReducedMotion) {
        ctx.fillStyle = `${effectiveColor}cc`; // ~80% alpha
        for (const e of edges) {
          e.packetT += e.packetSpeed * dt * 0.08 * e.packetDir;
          if (e.packetT > 1) e.packetT = 0;
          if (e.packetT < 0) e.packetT = 1;
          const a = points[e.a];
          const b = points[e.b];
          const x = a.x + (b.x - a.x) * e.packetT;
          const y = a.y + (b.y - a.y) * e.packetT;
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function onMouseMove(ev: MouseEvent) {
      const rect = canvasEl.getBoundingClientRect();
      mouseX = (ev.clientX - rect.left);
      mouseY = (ev.clientY - rect.top);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvasEl.parentElement || canvasEl);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    resize();
    lastTime = performance.now();
    if (!prefersReducedMotion) rafId = requestAnimationFrame(step);
    else draw(0);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [density, effectiveColor, interactive, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 pointer-events-none"
      aria-hidden
    />
  );
}


