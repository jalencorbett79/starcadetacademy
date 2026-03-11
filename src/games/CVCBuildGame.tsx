import React, { useState, useCallback } from 'react';
import GameShell from './GameShell';
import LaserCelebration from '../components/LaserCelebration';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Games.module.css';
import { playCorrect, playIncorrect, playLetterPlace } from '../lib/sounds';

interface CVCBuildGameProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const CVC_WORDS_EN = [
  { word: 'CAT', emoji: '🐱', letters: ['C', 'A', 'T'] },
  { word: 'DOG', emoji: '🐶', letters: ['D', 'O', 'G'] },
  { word: 'SUN', emoji: '☀️', letters: ['S', 'U', 'N'] },
  { word: 'BIG', emoji: '🏔️', letters: ['B', 'I', 'G'] },
  { word: 'HAT', emoji: '🎩', letters: ['H', 'A', 'T'] },
  { word: 'BUS', emoji: '🚌', letters: ['B', 'U', 'S'] },
  { word: 'MOP', emoji: '🧹', letters: ['M', 'O', 'P'] },
  { word: 'PEN', emoji: '🖊️', letters: ['P', 'E', 'N'] },
];

const CVC_WORDS_ES = [
  { word: 'SOL', emoji: '☀️', letters: ['S', 'O', 'L'] },
  { word: 'PAN', emoji: '🍞', letters: ['P', 'A', 'N'] },
  { word: 'MAR', emoji: '🌊', letters: ['M', 'A', 'R'] },
  { word: 'LUZ', emoji: '💡', letters: ['L', 'U', 'Z'] },
  { word: 'PEZ', emoji: '🐟', letters: ['P', 'E', 'Z'] },
  { word: 'SAL', emoji: '🧂', letters: ['S', 'A', 'L'] },
  { word: 'MES', emoji: '📅', letters: ['M', 'E', 'S'] },
  { word: 'RED', emoji: '🕸️', letters: ['R', 'E', 'D'] },
];

const TOTAL_ROUNDS = 5;
const XP_PER_CORRECT = 25;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CVCBuildGame({ onBack }: CVCBuildGameProps): React.ReactElement {
  const { t, language } = useLanguage();
  const { updateChildXP, addActivityEntry, updateChildSkill } = useAuth();

  const wordList = language === 'es' ? CVC_WORDS_ES : CVC_WORDS_EN;

  const [rounds] = useState(() => shuffle(wordList).slice(0, TOTAL_ROUNDS));

  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [builtWord, setBuiltWord] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>(() => {
    const r = rounds[0];
    const extra = 'XZQWKJ'.split('').filter(l => !r.letters.includes(l)).slice(0, 2);
    return shuffle([...r.letters, ...extra]);
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const round = rounds[currentRound];

  const handleLetterClick = useCallback(
    (letter: string, index: number) => {
      if (showResult) return;
      if (builtWord.length >= round.letters.length) return;

      const newBuilt = [...builtWord, letter];
      setBuiltWord(newBuilt);

      const newAvailable = [...availableLetters];
      newAvailable.splice(index, 1);
      setAvailableLetters(newAvailable);

      playLetterPlace();

      // Check if word is complete
      if (newBuilt.length === round.letters.length) {
        const correct = newBuilt.join('') === round.word;
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
            updateChildSkill('sightWords', 5);
            addActivityEntry({
              type: 'reading',
              module: 'cvcBuild',
              score: score + (correct ? 1 : 0),
              xpEarned: totalXP,
              timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
            });
            setShowCelebration(true);
            setGameComplete(true);
          } else {
            const nextRound = rounds[currentRound + 1];
            const extra = 'XZQWKJ'.split('').filter(l => !nextRound.letters.includes(l)).slice(0, 2);
            setCurrentRound((r) => r + 1);
            setBuiltWord([]);
            setAvailableLetters(shuffle([...nextRound.letters, ...extra]));
            setShowResult(false);
          }
        }, 1500);
      }
    },
    [showResult, builtWord, availableLetters, round, currentRound, score, rounds, updateChildXP, addActivityEntry, updateChildSkill, startTime]
  );

  const handleUndo = useCallback(() => {
    if (builtWord.length === 0 || showResult) return;
    const lastLetter = builtWord[builtWord.length - 1];
    setBuiltWord(builtWord.slice(0, -1));
    setAvailableLetters([...availableLetters, lastLetter]);
  }, [builtWord, availableLetters, showResult]);

  if (gameComplete && !showCelebration) {
    return (
      <GameShell title={t('reading.cvcBuild')} instruction={t('rewards.missionComplete')} onBack={onBack}>
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
      title={t('reading.cvcBuild')}
      instruction={`${t('reading.instructions.buildWord')} ${round.emoji}`}
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
        <span style={{ fontSize: '4rem' }}>{round.emoji}</span>
      </div>

      {/* Built word slots */}
      <div className={styles.wordSlots}>
        {round.letters.map((_, i) => (
          <div
            key={i}
            className={`${styles.wordSlot} ${builtWord[i] ? styles.filled : ''} ${
              showResult ? (isCorrect ? styles.slotCorrect : styles.slotIncorrect) : ''
            }`}
          >
            {builtWord[i] || '_'}
          </div>
        ))}
      </div>

      {/* Available letters */}
      <div className={styles.optionsGrid}>
        {availableLetters.map((letter, i) => (
          <NeonButton
            key={`${letter}-${i}`}
            variant="secondary"
            size="large"
            onClick={() => handleLetterClick(letter, i)}
            disabled={showResult}
            className={styles.optionBtn}
          >
            {letter}
          </NeonButton>
        ))}
      </div>

      {builtWord.length > 0 && !showResult && (
        <NeonButton variant="warning" size="small" onClick={handleUndo}>
          ↩ Undo
        </NeonButton>
      )}

      {showResult && (
        <div className={`${styles.feedback} ${isCorrect ? styles.correct : styles.incorrect}`}>
          {isCorrect ? `${t('common.correct')} ${round.word}!` : `${t('common.incorrect')} ${round.word}`}
        </div>
      )}
    </GameShell>
  );
}

export default CVCBuildGame;
