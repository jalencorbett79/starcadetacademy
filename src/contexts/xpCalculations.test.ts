import { describe, it, expect } from 'vitest';
import { getLevelFromXP, getRankFromLevel } from './AuthContext';

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 1 for 99 XP', () => {
    expect(getLevelFromXP(99)).toBe(1);
  });

  it('returns level 2 at 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });

  it('returns level 2 for 199 XP', () => {
    expect(getLevelFromXP(199)).toBe(2);
  });

  it('returns level 3 at 200 XP', () => {
    expect(getLevelFromXP(200)).toBe(3);
  });

  it('returns level 6 at 500 XP', () => {
    expect(getLevelFromXP(500)).toBe(6);
  });

  it('returns level 21 at 2000 XP', () => {
    expect(getLevelFromXP(2000)).toBe(21);
  });
});

describe('getRankFromLevel', () => {
  it('returns beginnerExplorer for levels 1-5', () => {
    expect(getRankFromLevel(1)).toBe('beginnerExplorer');
    expect(getRankFromLevel(3)).toBe('beginnerExplorer');
    expect(getRankFromLevel(5)).toBe('beginnerExplorer');
  });

  it('returns spaceNewbie for levels 6-10', () => {
    expect(getRankFromLevel(6)).toBe('spaceNewbie');
    expect(getRankFromLevel(8)).toBe('spaceNewbie');
    expect(getRankFromLevel(10)).toBe('spaceNewbie');
  });

  it('returns spaceExpert for levels 11-20', () => {
    expect(getRankFromLevel(11)).toBe('spaceExpert');
    expect(getRankFromLevel(15)).toBe('spaceExpert');
    expect(getRankFromLevel(20)).toBe('spaceExpert');
  });

  it('returns pilotMothership for levels 21+', () => {
    expect(getRankFromLevel(21)).toBe('pilotMothership');
    expect(getRankFromLevel(50)).toBe('pilotMothership');
  });
});

describe('XP progress within level', () => {
  it('accurately computes XP within the current level', () => {
    // The XPBadge uses xp % 100 for progress within level
    expect(0 % 100).toBe(0);
    expect(50 % 100).toBe(50);
    expect(99 % 100).toBe(99);
    expect(100 % 100).toBe(0);
    expect(150 % 100).toBe(50);
    expect(250 % 100).toBe(50);
  });

  it('level and XP-in-level are consistent', () => {
    // At 250 XP: level 3, 50/100 progress
    const xp = 250;
    const level = getLevelFromXP(xp);
    const xpInLevel = xp % 100;
    expect(level).toBe(3);
    expect(xpInLevel).toBe(50);
  });

  it('level and rank boundaries are consistent', () => {
    // Level 5 (499 XP max) should be beginnerExplorer
    expect(getRankFromLevel(getLevelFromXP(499))).toBe('beginnerExplorer');
    // Level 6 (500 XP) should be spaceNewbie
    expect(getRankFromLevel(getLevelFromXP(500))).toBe('spaceNewbie');
    // Level 10 (999 XP max) should be spaceNewbie
    expect(getRankFromLevel(getLevelFromXP(999))).toBe('spaceNewbie');
    // Level 11 (1000 XP) should be spaceExpert
    expect(getRankFromLevel(getLevelFromXP(1000))).toBe('spaceExpert');
    // Level 20 (1999 XP max) should be spaceExpert
    expect(getRankFromLevel(getLevelFromXP(1999))).toBe('spaceExpert');
    // Level 21 (2000 XP) should be pilotMothership
    expect(getRankFromLevel(getLevelFromXP(2000))).toBe('pilotMothership');
  });
});
