import React, { useEffect, useRef, useState } from 'react';
import styles from './LaserCelebration.module.css';
import { playCelebration } from '../lib/sounds';

interface LaserCelebrationProps {
  show: boolean;
  message?: string;
  xpEarned?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

/**
 * Retro 80s neon laser celebration animation
 * Triggers on mission complete with pixel star burst + laser sweep
 */
function LaserCelebration({ show, message = 'MISSION COMPLETE', xpEarned = 0, onComplete }: LaserCelebrationProps): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      setFadeOut(false);
      return;
    }

    setVisible(true);
    setFadeOut(false);
    playCelebration();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ['#ff6fd8', '#00d4ff', '#ff9500', '#00e676', '#ff4081', '#aa66ff', '#ffea00'];

    // Create burst particles from center
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 60 + Math.random() * 40,
      });
    }

    let frame = 0;
    let laserPhase = 0;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Laser sweep lines (first 30 frames)
      if (frame < 60) {
        laserPhase = frame / 60;
        const laserAlpha = Math.max(0, 1 - laserPhase);

        // Horizontal laser
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(canvas.width * laserPhase * 2, cy);
        ctx.strokeStyle = `rgba(255, 111, 216, ${laserAlpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff6fd8';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Diagonal lasers
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width * laserPhase * 1.5, canvas.height * laserPhase * 1.5);
        ctx.strokeStyle = `rgba(0, 212, 255, ${laserAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(canvas.width, 0);
        ctx.lineTo(canvas.width - canvas.width * laserPhase * 1.5, canvas.height * laserPhase * 1.5);
        ctx.strokeStyle = `rgba(0, 230, 118, ${laserAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // slight gravity
        p.life++;

        const lifeRatio = 1 - p.life / p.maxLife;
        if (lifeRatio <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Pixel-style square particles for retro feel
        ctx.fillStyle = p.color;
        ctx.globalAlpha = lifeRatio;
        ctx.fillRect(
          Math.floor(p.x - p.size / 2),
          Math.floor(p.y - p.size / 2),
          Math.ceil(p.size),
          Math.ceil(p.size)
        );
        ctx.globalAlpha = 1;
      }

      if (frame < 180 && (particles.length > 0 || frame < 60)) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Auto-dismiss after 2.8 seconds
    const fadeTimer = setTimeout(() => setFadeOut(true), 2400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.content}>
        <h1 className={styles.title}>{message}</h1>
        {xpEarned > 0 && (
          <div className={styles.xp}>+{xpEarned} XP</div>
        )}
      </div>
    </div>
  );
}

export default LaserCelebration;
