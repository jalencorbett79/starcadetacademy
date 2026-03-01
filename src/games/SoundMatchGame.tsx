import React, { useState, useCallback, useMemo } from 'react';
import GameShell from './GameShell';
import LaserCelebration from '../components/LaserCelebration';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Games.module.css';
import { playCorrect, playIncorrect } from '../lib/sounds';

interface SoundMatchGameProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// Phonics data per language
const PHONICS_EN: { letter: string; sound: string; example: string }[] = [
  { letter: 'A', sound: '/æ/', example: 'apple 🍎' },
  { letter: 'B', sound: '/b/', example: 'ball ⚽' },
  { letter: 'C', sound: '/k/', example: 'cat 🐱' },
  { letter: 'D', sound: '/d/', example: 'dog 🐶' },
  { letter: 'E', sound: '/ɛ/', example: 'egg 🥚' },
  { letter: 'F', sound: '/f/', example: 'fish 🐟' },
  { letter: 'G', sound: '/g/', example: 'goat 🐐' },
  { letter: 'H', sound: '/h/', example: 'hat 🎩' },
  { letter: 'M', sound: '/m/', example: 'moon 🌙' },
  { letter: 'S', sound: '/s/', example: 'sun ☀️' },
  { letter: 'T', sound: '/t/', example: 'tree 🌳' },
  { letter: 'R', sound: '/r/', example: 'rain 🌧️' },
];

const PHONICS_ES: { letter: string; sound: string; example: string }[] = [
  { letter: 'A', sound: '/a/', example: 'avión ✈️' },
  { letter: 'B', sound: '/b/', example: 'barco 🚢' },
  { letter: 'C', sound: '/s/ o /k/', example: 'casa 🏠' },
  { letter: 'D', sound: '/d/', example: 'dedo 👆' },
  { letter: 'E', sound: '/e/', example: 'estrella ⭐' },
  { letter: 'F', sound: '/f/', example: 'flor 🌸' },
  { letter: 'G', sound: '/g/ o /x/', example: 'gato 🐱' },
  { letter: 'L', sound: '/l/', example: 'luna 🌙' },
  { letter: 'M', sound: '/m/', example: 'mano ✋' },
  { letter: 'N', sound: '/n/', example: 'nube ☁️' },
  { letter: 'P', sound: '/p/', example: 'perro 🐶' },
  { letter: 'S', sound: '/s/', example: 'sol ☀️' },
];

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

function SoundMatchGame({ onBack }: SoundMatchGameProps): React.ReactElement {
  const { t, language } = useLanguage();
  const { updateChildXP, addActivityEntry, updateChildSkill } = useAuth();

  const phonics = language === 'es' ? PHONICS_ES : PHONICS_EN;

  const rounds = useMemo(() => {
    const shuffled = shuffle(phonics);
    return shuffled.slice(0, TOTAL_ROUNDS).map((target) => {
      let options = [target];
      const others = phonics.filter((p) => p.letter !== target.letter);
      const shuffledOthers = shuffle(others);
      options = [...options, ...shuffledOthers.slice(0, 3)];
      return { target, options: shuffle(options) };
    });
  }, [phonics]);

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
      const correct = letter === round.target.letter;
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
          updateChildSkill('phonics', 5);
          addActivityEntry({
            type: 'reading',
            module: 'soundMatch',
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
    [selected, round, currentRound, score, updateChildXP, addActivityEntry, updateChildSkill, startTime]
  );

  if (gameComplete && !showCelebration) {
    return (
      <GameShell title={t('reading.soundMatch')} instruction={t('rewards.missionComplete')} onBack={onBack}>
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
      title={t('reading.soundMatch')}
      instruction={`${t('reading.instructions.whatSound')} ${round.target.sound} → ${round.target.example}`}
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
        <span className={styles.soundHint}>{round.target.sound}</span>
        <span className={styles.exampleHint}>{round.target.example}</span>
      </div>

      <div className={styles.optionsGrid}>
        {round.options.map((opt) => {
          let variant: 'primary' | 'secondary' | 'success' | 'warning' = 'secondary';
          if (showResult && selected === opt.letter) {
            variant = isCorrect ? 'success' : 'warning';
          }
          if (showResult && opt.letter === round.target.letter && !isCorrect) {
            variant = 'success';
          }

          return (
            <NeonButton
              key={opt.letter}
              variant={variant}
              size="xlarge"
              onClick={() => handleSelect(opt.letter)}
              disabled={!!selected}
              className={styles.optionBtn}
            >
              {opt.letter}
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

export default SoundMatchGame;
