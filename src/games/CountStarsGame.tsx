import React, { useState, useCallback, useMemo } from 'react';
import GameShell from './GameShell';
import LaserCelebration from '../components/LaserCelebration';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Games.module.css';

interface CountStarsGameProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const EMOJIS = ['⭐', '👽', '🪐', '🛸', '🌙'];
const TOTAL_ROUNDS = 5;
const XP_PER_CORRECT = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound() {
  const count = Math.floor(Math.random() * 8) + 1; // 1-8
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  let options = [count];
  while (options.length < 4) {
    const r = Math.floor(Math.random() * 10) + 1;
    if (!options.includes(r)) options.push(r);
  }
  return { count, emoji, options: shuffle(options) };
}

function CountStarsGame({ onBack }: CountStarsGameProps): React.ReactElement {
  const { t } = useLanguage();
  const { updateChildXP, addActivityEntry, updateChildSkill } = useAuth();

  const rounds = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, () => generateRound()), []);

  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const round = rounds[currentRound];

  const handleSelect = useCallback(
    (num: number) => {
      if (selected !== null) return;
      setSelected(num);
      const correct = num === round.count;
      setIsCorrect(correct);
      setShowResult(true);

      if (correct) setScore((s) => s + 1);

      setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          const totalXP = (score + (correct ? 1 : 0)) * XP_PER_CORRECT;
          updateChildXP(totalXP);
          updateChildSkill('counting', 5);
          addActivityEntry({
            type: 'counting',
            module: 'countStars',
            score: score + (correct ? 1 : 0),
            xpEarned: totalXP,
            timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
          });
          setShowCelebration(true);
          setGameComplete(true);
        } else {
          setCurrentRound((r) => r + 1);
          setSelected(null);
          setShowResult(false);
        }
      }, 1200);
    },
    [selected, round.count, currentRound, score, updateChildXP, addActivityEntry, updateChildSkill, startTime]
  );

  if (gameComplete && !showCelebration) {
    return (
      <GameShell title={t('counting.countStars')} instruction={t('rewards.missionComplete')} onBack={onBack}>
        <div className={styles.completeScreen}>
          <div className={styles.finalScore}>
            {score}/{TOTAL_ROUNDS}
          </div>
          <NeonButton variant="primary" size="large" onClick={onBack}>
            {t('missions.back')} 🚀
          </NeonButton>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell
      title={t('counting.countStars')}
      instruction={t('counting.instructions.howMany')}
      onBack={onBack}
      progress={{ current: currentRound + 1, total: TOTAL_ROUNDS }}
    >
      <LaserCelebration
        show={showCelebration}
        message={t('rewards.missionComplete')}
        xpEarned={score * XP_PER_CORRECT}
        onComplete={() => setShowCelebration(false)}
      />

      <div className={styles.emojiField}>
        {Array.from({ length: round.count }).map((_, i) => (
          <span key={i} className={styles.countEmoji} style={{ animationDelay: `${i * 0.1}s` }}>
            {round.emoji}
          </span>
        ))}
      </div>

      <div className={styles.optionsGrid}>
        {round.options.map((num) => {
          let variant: 'primary' | 'secondary' | 'success' | 'warning' = 'secondary';
          if (showResult && selected === num) {
            variant = isCorrect ? 'success' : 'warning';
          }
          if (showResult && num === round.count && !isCorrect) {
            variant = 'success';
          }

          return (
            <NeonButton
              key={num}
              variant={variant}
              size="xlarge"
              onClick={() => handleSelect(num)}
              disabled={selected !== null}
              className={styles.optionBtn}
            >
              {num}
            </NeonButton>
          );
        })}
      </div>

      {showResult && (
        <div className={`${styles.feedback} ${isCorrect ? styles.correct : styles.incorrect}`}>
          {isCorrect ? t('common.correct') : `${t('common.incorrect')} ${round.count}!`}
        </div>
      )}
    </GameShell>
  );
}

export default CountStarsGame;
