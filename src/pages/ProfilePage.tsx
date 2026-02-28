import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import NavBar from '../components/NavBar';
import XPBadge from '../components/XPBadge';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

const RANK_BADGES: Record<string, { icon: string; color: string }> = {
  beginnerExplorer: { icon: '🌟', color: '#00d4ff' },
  spaceNewbie: { icon: '🚀', color: '#00e676' },
  spaceExpert: { icon: '🛸', color: '#ff9500' },
  pilotMothership: { icon: '👨‍🚀', color: '#ff6fd8' },
};

function ProfilePage({ onNavigate }: ProfilePageProps): React.ReactElement {
  const { activeChild } = useAuth();
  const { t } = useLanguage();

  if (!activeChild) {
    onNavigate('childSelect');
    return <div />;
  }

  const badge = RANK_BADGES[activeChild.rank] || RANK_BADGES.beginnerExplorer;

  return (
    <div className={styles.page}>
      <NavBar currentPage="profile" onNavigate={onNavigate} />

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.avatar} style={{ background: activeChild.avatarColor }}>
            {activeChild.name.charAt(0).toUpperCase()}
          </div>
          <h1 className={styles.name}>{activeChild.name}</h1>
          <p className={styles.ageLabel}>{t(`missions.age${activeChild.age}`)}</p>

          <XPBadge xp={activeChild.xp} level={activeChild.level} rank={activeChild.rank} />
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎮</span>
            <span className={styles.statValue}>{activeChild.missionsCompleted}</span>
            <span className={styles.statLabel}>{t('dashboard.missionsCompleted')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔥</span>
            <span className={styles.statValue}>{activeChild.streakDays}</span>
            <span className={styles.statLabel}>{t('dashboard.streak')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⭐</span>
            <span className={styles.statValue}>{activeChild.xp}</span>
            <span className={styles.statLabel}>{t('dashboard.totalXP')}</span>
          </div>
        </div>

        <div className={styles.badgesSection}>
          <h2 className={styles.sectionTitle}>🏅 {t('profile.badges')}</h2>
          <div className={styles.badgeGrid}>
            {Object.entries(RANK_BADGES).map(([rank, b]) => {
              const unlocked = isRankUnlocked(rank, activeChild.level);
              return (
                <div
                  key={rank}
                  className={`${styles.badgeItem} ${unlocked ? styles.unlocked : styles.locked}`}
                  style={{ borderColor: unlocked ? b.color : 'transparent' }}
                >
                  <span className={styles.badgeIcon}>{unlocked ? b.icon : '🔒'}</span>
                  <span className={styles.badgeName} style={{ color: unlocked ? b.color : '#4a5568' }}>
                    {t(`xp.ranks.${rank}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.skillsSection}>
          <h2 className={styles.sectionTitle}>📊 {t('dashboard.skills')}</h2>
          <div className={styles.skillBars}>
            {Object.entries(activeChild.skills).map(([skill, value]) => (
              <div key={skill} className={styles.skillRow}>
                <span className={styles.skillName}>
                  {t(`dashboard.${skill}`)}
                </span>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: `${value}%`, background: badge.color }}
                  />
                </div>
                <span className={styles.skillValue}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function isRankUnlocked(rank: string, level: number): boolean {
  switch (rank) {
    case 'beginnerExplorer': return level >= 1;
    case 'spaceNewbie': return level >= 6;
    case 'spaceExpert': return level >= 11;
    case 'pilotMothership': return level >= 21;
    default: return false;
  }
}

export default ProfilePage;
