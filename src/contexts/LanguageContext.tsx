import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Language, t } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps): React.ReactElement {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('starCadetLang');
    return (stored === 'es' ? 'es' : 'en') as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('starCadetLang', lang);
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'es' : 'en');
  }, [language, setLanguage]);

  const translate = useCallback((key: string) => t(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
