import React from 'react';
import StarfieldCanvas from '../components/StarfieldCanvas';
import NeonButton from '../components/NeonButton';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './LandingPage.module.css';
import { startMusic, isMusicPlaying } from '../lib/music';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

function LandingPage({ onNavigate }: LandingPageProps): React.ReactElement {
  const { t } = useLanguage();

  const handleBeginMission = () => {
    if (!isMusicPlaying()) {
      startMusic();
    }
    onNavigate('childSelect');
  };

  return (
    <div className={styles.landing}>
      <StarfieldCanvas speed={0.3} starCount={350} />

      <div className={styles.langToggleWrapper}>
        <LanguageToggle />
      </div>

      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.rocketIcon}>🚀</div>
          <h1 className={styles.title}>{t('landing.heroTitle')}</h1>
          <p className={styles.subtitle}>{t('landing.heroSubtitle')}</p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📖</span>
              <span className={styles.featureName}>{t('landing.features.reading')}</span>
              <span className={styles.featureDesc}>{t('landing.features.readingDesc')}</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔢</span>
              <span className={styles.featureName}>{t('landing.features.counting')}</span>
              <span className={styles.featureDesc}>{t('landing.features.countingDesc')}</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🌎</span>
              <span className={styles.featureName}>{t('landing.features.bilingual')}</span>
              <span className={styles.featureDesc}>{t('landing.features.bilingualDesc')}</span>
            </div>
          </div>

          <div className={styles.ctaButtons}>
            <NeonButton variant="primary" size="xlarge" onClick={handleBeginMission}>
              {t('landing.ctaButton')}
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
