import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import NavBar from '../components/NavBar';
import XPBadge from '../components/XPBadge';
import NeonButton from '../components/NeonButton';
import styles from './MissionsPage.module.css';

// Reading modules per age
import LetterMatchGame from '../games/LetterMatchGame';
import SoundMatchGame from '../games/SoundMatchGame';
import CVCBuildGame from '../games/CVCBuildGame';
import CountStarsGame from '../games/CountStarsGame';
import RocketFuelMathGame from '../games/RocketFuelMathGame';

interface MissionsPageProps {
  onNavigate: (page: string) => void;
}

type GameType = 'letterMatch' | 'soundMatch' | 'cvcBuild' | 'countStars' | 'rocketFuel' | null;

function MissionsPage({ onNavigate }: MissionsPageProps): React.ReactElement {
  const { activeChild } = useAuth();
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState<GameType>(null);

  if (!activeChild) {
    onNavigate('childSelect');
    return <div />;
  }

  const age = activeChild.age;

  const readingMissions = getReadingMissions(age, t);
  const countingMissions = getCountingMissions(age, t);

  if (activeGame) {
    return renderGame(activeGame, () => setActiveGame(null), onNavigate);
  }

  return (
    <div className={styles.page}>
      <NavBar currentPage="missions" onNavigate={onNavigate} />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>🎮 {t('missions.title')}</h1>
          <XPBadge xp={activeChild.xp} level={activeChild.level} rank={activeChild.rank} />
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📖 {t('missions.reading')}</h2>
          <div className={styles.missionGrid}>
            {readingMissions.map((mission) => (
              <div key={mission.id} className={styles.missionCard}>
                <span className={styles.missionIcon}>{mission.icon}</span>
                <h3 className={styles.missionName}>{mission.name}</h3>
                <p className={styles.missionDesc}>{mission.desc}</p>
                <NeonButton
                  variant="primary"
                  size="medium"
                  onClick={() => setActiveGame(mission.id as GameType)}
                >
                  {t('missions.start')} 🚀
                </NeonButton>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔢 {t('missions.counting')}</h2>
          <div className={styles.missionGrid}>
            {countingMissions.map((mission) => (
              <div key={mission.id} className={styles.missionCard}>
                <span className={styles.missionIcon}>{mission.icon}</span>
                <h3 className={styles.missionName}>{mission.name}</h3>
                <p className={styles.missionDesc}>{mission.desc}</p>
                <NeonButton
                  variant="secondary"
                  size="medium"
                  onClick={() => setActiveGame(mission.id as GameType)}
                >
                  {t('missions.start')} 🚀
                </NeonButton>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface Mission {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

function getReadingMissions(age: number, t: (key: string) => string): Mission[] {
  const missions: Mission[] = [];

  if (age >= 3) {
    missions.push({
      id: 'letterMatch',
      icon: '🔤',
      name: t('reading.letterMatch'),
      desc: t('reading.letterMatchDesc'),
    });
    missions.push({
      id: 'soundMatch',
      icon: '🔊',
      name: t('reading.soundMatch'),
      desc: t('reading.soundMatchDesc'),
    });
  }

  if (age >= 4) {
    missions.push({
      id: 'cvcBuild',
      icon: '🧩',
      name: t('reading.cvcBuild'),
      desc: t('reading.cvcBuildDesc'),
    });
  }

  return missions;
}

function getCountingMissions(age: number, t: (key: string) => string): Mission[] {
  const missions: Mission[] = [];

  if (age >= 3) {
    missions.push({
      id: 'countStars',
      icon: '⭐',
      name: t('counting.countStars'),
      desc: t('counting.countStarsDesc'),
    });
  }

  if (age >= 4) {
    missions.push({
      id: 'rocketFuel',
      icon: '🚀',
      name: t('counting.rocketFuel'),
      desc: t('counting.rocketFuelDesc'),
    });
  }

  return missions;
}

function renderGame(game: GameType, onBack: () => void, onNavigate: (page: string) => void): React.ReactElement {
  switch (game) {
    case 'letterMatch':
      return <LetterMatchGame onBack={onBack} onNavigate={onNavigate} />;
    case 'soundMatch':
      return <SoundMatchGame onBack={onBack} onNavigate={onNavigate} />;
    case 'cvcBuild':
      return <CVCBuildGame onBack={onBack} onNavigate={onNavigate} />;
    case 'countStars':
      return <CountStarsGame onBack={onBack} onNavigate={onNavigate} />;
    case 'rocketFuel':
      return <RocketFuelMathGame onBack={onBack} onNavigate={onNavigate} />;
    default:
      return <div />;
  }
}

export default MissionsPage;
