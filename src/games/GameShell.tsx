import React, { useEffect } from 'react';
import NeonButton from '../components/NeonButton';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './GameShell.module.css';
import { lowerMusicForGame, restoreMusicVolume } from '../lib/music';

interface GameShellProps {
  children: React.ReactNode;
  title: string;
  instruction: string;
  onBack: () => void;
  progress?: { current: number; total: number };
}

/**
 * Shared game wrapper with consistent layout, instruction bar, progress, and back button.
 */
function GameShell({ children, title, instruction, onBack, progress }: GameShellProps): React.ReactElement {
  const { t } = useLanguage();

  useEffect(() => {
    lowerMusicForGame();
    return () => {
      restoreMusicVolume();
    };
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <NeonButton variant="secondary" size="small" onClick={onBack}>
          ← {t('missions.back')}
        </NeonButton>
        <h2 className={styles.title}>{title}</h2>
        {progress && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {progress.current}/{progress.total}
            </span>
          </div>
        )}
      </div>

      <div className={styles.instruction}>{instruction}</div>

      <div className={styles.gameArea}>{children}</div>
    </div>
  );
}

export default GameShell;
