import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";

export interface ParticlesProps {
  quantity?: number;
  size?: number;
  staticity?: number;
  color?: string;
  className?: string;
  ease?: number;
  refresh?: boolean;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaDir: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return [34, 224, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export function Particles({
  quantity = 60,
  size = 1.4,
  staticity = 50,
  color = "#94a3b8",
  className,
  ease = 50,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const [r, g, b] = hexToRgb(color);

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      particlesRef.current = Array.from({ length: quantity }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: size * (0.6 + Math.random() * 1.1),
          alpha: 0.2 + Math.random() * 0.6,
          alphaDir: Math.random() > 0.5 ? 1 : -1,
        };
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const easeFactor = Math.max(5, ease);
      for (const p of particlesRef.current) {
        // drift
        p.baseX += p.vx;
        p.baseY += p.vy;
        if (p.baseX < 0 || p.baseX > width) p.vx *= -1;
        if (p.baseY < 0 || p.baseY > height) p.vy *= -1;

        // mouse parallax (toward mouse with damping)
        let targetX = p.baseX;
        let targetY = p.baseY;
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.baseX;
          const dy = mouseRef.current.y - p.baseY;
          const dist = Math.hypot(dx, dy);
          const radius = 180;
          if (dist < radius) {
            const force = (1 - dist / radius) * (100 / Math.max(staticity, 1));
            targetX = p.baseX + (dx / Math.max(dist, 0.01)) * force;
            targetY = p.baseY + (dy / Math.max(dist, 0.01)) * force;
          }
        }
        p.x += (targetX - p.x) / easeFactor;
        p.y += (targetY - p.y) / easeFactor;

        // alpha pulse
        p.alpha += 0.005 * p.alphaDir;
        if (p.alpha <= 0.1) p.alphaDir = 1;
        if (p.alpha >= 0.9) p.alphaDir = -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [quantity, size, staticity, color, ease]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 -z-10 h-full w-full pointer-events-none",
        className
      )}
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default Particles;
