import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import styles from './NavBar.module.css';

interface NavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function NavBar({ currentPage, onNavigate }: NavBarProps): React.ReactElement {
  const { t } = useLanguage();
  const { activeChild } = useAuth();

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <button className={styles.logo} onClick={() => onNavigate('home')}>
          <span className={styles.logoIcon}>🚀</span>
          <span className={styles.logoText}>{t('app.title')}</span>
        </button>
      </div>

      <div className={styles.center}>
        {activeChild && (
          <>
            <button
              className={`${styles.navLink} ${currentPage === 'missions' ? styles.active : ''}`}
              onClick={() => onNavigate('missions')}
            >
              🎮 {t('nav.missions')}
            </button>
            <button
              className={`${styles.navLink} ${currentPage === 'profile' ? styles.active : ''}`}
              onClick={() => onNavigate('profile')}
            >
              👨‍🚀 {t('nav.profile')}
            </button>
            <button
              className={`${styles.navLink} ${currentPage === 'dashboard' ? styles.active : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              📊 {t('nav.dashboard')}
            </button>
          </>
        )}
      </div>

      <div className={styles.right}>
        <LanguageToggle />
      </div>
    </nav>
  );
}

export default NavBar;
