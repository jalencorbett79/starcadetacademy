import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './LanguageToggle.module.css';

function LanguageToggle(): React.ReactElement {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      className={styles.toggle}
      onClick={toggleLanguage}
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <span className={styles.flag}>
        {language === 'en' ? '🇪🇸' : '🇺🇸'}
      </span>
      <span className={styles.label}>
        {language === 'en' ? 'ESP' : 'ENG'}
      </span>
    </button>
  );
}

export default LanguageToggle;
