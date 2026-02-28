import React, { useRef, useEffect, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

interface StarfieldCanvasProps {
  speed?: number;
  starCount?: number;
  className?: string;
}

/**
 * Cinematic starfield - flying through space effect
 * Uses Canvas API for 60fps smooth animation
 * Low CPU usage, mobile optimized
 */
function StarfieldCanvas({ speed = 0.5, starCount = 400, className }: StarfieldCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;
  }, [starCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) {
        initStars(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      if (!ctx || !canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 8, 0.15)';
      ctx.fillRect(0, 0, w, h);

      const stars = starsRef.current;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star toward viewer
        star.z -= speed * 2;

        // Reset star when it passes the viewer
        if (star.z <= 0) {
          star.x = Math.random() * w - cx;
          star.y = Math.random() * h - cy;
          star.z = 1000;
          star.size = Math.random() * 2 + 0.5;
          star.opacity = Math.random() * 0.8 + 0.2;
        }

        // Project 3D to 2D
        const k = 300 / star.z;
        const sx = star.x * k + cx;
        const sy = star.y * k + cy;

        // Skip if off screen
        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

        // Size and brightness increase as star gets closer
        const depth = 1 - star.z / 1000;
        const size = star.size * (1 + depth * 3);
        const alpha = star.opacity * (0.3 + depth * 0.7);

        // Draw star with glow
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();

        // Subtle glow for closer/larger stars
        if (size > 1.5) {
          ctx.beginPath();
          ctx.arc(sx, sy, size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 200, 255, ${alpha * 0.15})`;
          ctx.fill();
        }

        // Draw streak/trail for very close stars
        if (depth > 0.7) {
          const prevK = 300 / (star.z + speed * 6);
          const prevSx = star.x * prevK + cx;
          const prevSy = star.y * prevK + cy;

          ctx.beginPath();
          ctx.moveTo(prevSx, prevSy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.4})`;
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [speed, initStars]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: '#000008',
      }}
    />
  );
}

export default StarfieldCanvas;
