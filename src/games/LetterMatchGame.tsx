import React, { useState, useCallback } from 'react';
import GameShell from './GameShell';
import LaserCelebration from '../components/LaserCelebration';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Games.module.css';
import { playCorrect, playIncorrect } from '../lib/sounds';

interface LetterMatchGameProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
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
  const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  let options = [target];
  while (options.length < 4) {
    const r = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    if (!options.includes(r)) options.push(r);
  }
  options = shuffle(options);
  return { target, options };
}

function LetterMatchGame({ onBack }: LetterMatchGameProps): React.ReactElement {
  const { t } = useLanguage();
  const { updateChildXP, addActivityEntry, updateChildSkill } = useAuth();

  const [rounds] = useState(() => Array.from({ length: TOTAL_ROUNDS }, () => generateRound()));

  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const round = rounds[currentRound];

  const handleSelect = useCallback(
    (letter: string) => {
      if (selected) return;
      setSelected(letter);
      const correct = letter === round.target;
      setIsCorrect(correct);
      setShowResult(true);

      if (correct) {
        playCorrect();
        setScore((s) => s + 1);
      } else {
        playIncorrect();
      }

      setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          const totalXP = (score + (correct ? 1 : 0)) * XP_PER_CORRECT;
          updateChildXP(totalXP);
          updateChildSkill('letterRecognition', 5);
          addActivityEntry({
            type: 'reading',
            module: 'letterMatch',
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
    [selected, round.target, currentRound, score, updateChildXP, addActivityEntry, updateChildSkill, startTime]
  );

  if (gameComplete && !showCelebration) {
    return (
      <GameShell title={t('reading.letterMatch')} instruction={t('rewards.missionComplete')} onBack={onBack}>
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
      title={t('reading.letterMatch')}
      instruction={`${t('reading.instructions.findLetter')} "${round.target}"`}
      onBack={onBack}
      progress={{ current: currentRound + 1, total: TOTAL_ROUNDS }}
    >
      <LaserCelebration
        show={showCelebration}
        message={t('rewards.missionComplete')}
        xpEarned={score * XP_PER_CORRECT}
        onComplete={() => setShowCelebration(false)}
      />

      <div className={styles.targetDisplay}>
        <span className={styles.targetLetter}>{round.target}</span>
      </div>

      <div className={styles.optionsGrid}>
        {round.options.map((letter) => {
          let variant: 'primary' | 'secondary' | 'success' | 'warning' = 'secondary';
          if (showResult && selected === letter) {
            variant = isCorrect ? 'success' : 'warning';
          }
          if (showResult && letter === round.target && !isCorrect) {
            variant = 'success';
          }

          return (
            <NeonButton
              key={letter}
              variant={variant}
              size="xlarge"
              onClick={() => handleSelect(letter)}
              disabled={!!selected}
              className={styles.optionBtn}
            >
              {letter}
            </NeonButton>
          );
        })}
      </div>

      {showResult && (
        <div className={`${styles.feedback} ${isCorrect ? styles.correct : styles.incorrect}`}>
          {isCorrect ? t('common.correct') : t('common.incorrect')}
        </div>
      )}
    </GameShell>
  );
}

export default LetterMatchGame;
