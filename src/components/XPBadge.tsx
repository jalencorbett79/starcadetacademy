import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './XPBadge.module.css';

interface XPBadgeProps {
  xp: number;
  level: number;
  rank: string;
  showDetails?: boolean;
}

const RANK_COLORS: Record<string, { primary: string; glow: string }> = {
  beginnerExplorer: { primary: '#00d4ff', glow: 'rgba(0, 212, 255, 0.4)' },
  spaceNewbie: { primary: '#00e676', glow: 'rgba(0, 230, 118, 0.4)' },
  spaceExpert: { primary: '#ff9500', glow: 'rgba(255, 149, 0, 0.4)' },
  pilotMothership: { primary: '#ff6fd8', glow: 'rgba(255, 111, 216, 0.4)' },
};

const RANK_ICONS: Record<string, string> = {
  beginnerExplorer: '🌟',
  spaceNewbie: '🚀',
  spaceExpert: '🛸',
  pilotMothership: '👨‍🚀',
};

function XPBadge({ xp, level, rank, showDetails = true }: XPBadgeProps): React.ReactElement {
  const { t } = useLanguage();
  const colors = RANK_COLORS[rank] || RANK_COLORS.beginnerExplorer;
  const icon = RANK_ICONS[rank] || '🌟';

  const xpInLevel = xp % 100;
  const progressPercent = xpInLevel;

  return (
    <div className={styles.badge} style={{ borderColor: colors.primary, boxShadow: `0 0 15px ${colors.glow}` }}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.info}>
        <div className={styles.rank} style={{ color: colors.primary }}>
          {t(`xp.ranks.${rank}`)}
        </div>
        {showDetails && (
          <>
            <div className={styles.level}>
              {t('xp.level')} {level}
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%`, background: colors.primary }}
              />
            </div>
            <div className={styles.xpText}>{xpInLevel}/100 XP</div>
          </>
        )}
      </div>
    </div>
  );
}

export default XPBadge;
