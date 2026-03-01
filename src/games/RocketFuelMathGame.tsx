import React, { useState, useCallback, useMemo } from 'react';
import GameShell from './GameShell';
import LaserCelebration from '../components/LaserCelebration';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Games.module.css';
import { playCorrect, playIncorrect, playRocketLaunch } from '../lib/sounds';

interface RocketFuelMathGameProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const TOTAL_ROUNDS = 5;
const XP_PER_CORRECT = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound() {
  const a = Math.floor(Math.random() * 6) + 1; // 1-6
  const b = Math.floor(Math.random() * 6) + 1; // 1-6
  const answer = a + b;
  let options = [answer];
  while (options.length < 4) {
    const r = Math.floor(Math.random() * 15) + 1;
    if (!options.includes(r)) options.push(r);
  }
  return { a, b, answer, options: shuffle(options) };
}

function RocketFuelMathGame({ onBack }: RocketFuelMathGameProps): React.ReactElement {
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
  const [rocketLaunched, setRocketLaunched] = useState(false);
  const [startTime] = useState(Date.now());

  const round = rounds[currentRound];

  const handleSelect = useCallback(
    (num: number) => {
      if (selected !== null) return;
      setSelected(num);
      const correct = num === round.answer;
      setIsCorrect(correct);
      setShowResult(true);
      if (correct) {
        playCorrect();
        setScore((s) => s + 1);
        setRocketLaunched(true);
        setTimeout(() => playRocketLaunch(), 300);
      } else {
        playIncorrect();
      }

      setTimeout(() => {
        setRocketLaunched(false);
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          const totalXP = (score + (correct ? 1 : 0)) * XP_PER_CORRECT;
          updateChildXP(totalXP);
          updateChildSkill('addition', 5);
          addActivityEntry({
            type: 'counting',
            module: 'rocketFuel',
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
      }, 1500);
    },
    [selected, round.answer, currentRound, score, updateChildXP, addActivityEntry, updateChildSkill, startTime]
  );

  if (gameComplete && !showCelebration) {
    return (
      <GameShell title={t('counting.rocketFuel')} instruction={t('rewards.missionComplete')} onBack={onBack}>
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
      title={t('counting.rocketFuel')}
      instruction={t('counting.instructions.addFuel')}
      onBack={onBack}
      progress={{ current: currentRound + 1, total: TOTAL_ROUNDS }}
    >
      <LaserCelebration
        show={showCelebration}
        message={t('rewards.missionComplete')}
        xpEarned={score * XP_PER_CORRECT}
        onComplete={() => setShowCelebration(false)}
      />

      <div className={styles.mathDisplay}>
        <div className={styles.rocketScene}>
          <span className={`${styles.rocket} ${rocketLaunched ? styles.rocketLaunch : ''}`}>🚀</span>
        </div>

        <div className={styles.fuelTanks}>
          <div className={styles.fuelTank}>
            <span className={styles.fuelIcon}>⛽</span>
            <span className={styles.fuelNumber}>{round.a}</span>
          </div>
          <span className={styles.mathOperator}>+</span>
          <div className={styles.fuelTank}>
            <span className={styles.fuelIcon}>⛽</span>
            <span className={styles.fuelNumber}>{round.b}</span>
          </div>
          <span className={styles.mathOperator}>=</span>
          <span className={styles.mathQuestion}>?</span>
        </div>

        {/* Visual blocks */}
        <div className={styles.visualBlocks}>
          <div className={styles.blockGroup}>
            {Array.from({ length: round.a }).map((_, i) => (
              <span key={`a-${i}`} className={styles.block} style={{ background: '#ff6fd8' }}>⬛</span>
            ))}
          </div>
          <span className={styles.blockPlus}>+</span>
          <div className={styles.blockGroup}>
            {Array.from({ length: round.b }).map((_, i) => (
              <span key={`b-${i}`} className={styles.block} style={{ background: '#00d4ff' }}>⬛</span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.optionsGrid}>
        {round.options.map((num) => {
          let variant: 'primary' | 'secondary' | 'success' | 'warning' = 'secondary';
          if (showResult && selected === num) {
            variant = isCorrect ? 'success' : 'warning';
          }
          if (showResult && num === round.answer && !isCorrect) {
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
          {isCorrect
            ? `${t('common.correct')} ${round.a} + ${round.b} = ${round.answer}`
            : `${t('common.incorrect')} ${round.a} + ${round.b} = ${round.answer}`}
        </div>
      )}
    </GameShell>
  );
}

export default RocketFuelMathGame;
