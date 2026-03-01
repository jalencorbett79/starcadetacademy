import React, { useState } from 'react';
import StarfieldCanvas from '../components/StarfieldCanvas';
import NeonButton from '../components/NeonButton';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './LandingPage.module.css';
import { startMusic, isMusicPlaying } from '../lib/music';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

function LandingPage({ onNavigate }: LandingPageProps): React.ReactElement {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'signup'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleBackToHero = () => {
    setAuthMode('none');
    setError('');
  };

  if (isAuthenticated) {
    onNavigate('childSelect');
    return <div />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      if (!isMusicPlaying()) {
        startMusic();
      }
      onNavigate('childSelect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await signup(email, password, parentName);
      if (!isMusicPlaying()) {
        startMusic();
      }
      onNavigate('childSelect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.landing}>
      <StarfieldCanvas speed={0.3} starCount={350} />

      <div className={styles.langToggleWrapper}>
        <LanguageToggle />
      </div>

      <div className={styles.content}>
        {authMode === 'none' && (
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
              <NeonButton variant="primary" size="xlarge" onClick={() => setAuthMode('signup')}>
                {t('landing.ctaButton')}
              </NeonButton>
              <NeonButton variant="secondary" size="large" onClick={() => setAuthMode('login')}>
                {t('auth.login')}
              </NeonButton>
            </div>
          </div>
        )}

        {authMode === 'login' && (
          <div className={styles.authCard}>
            <button className={styles.backBtn} onClick={handleBackToHero}>
              ← {t('common.back')}
            </button>
            <h2 className={styles.authTitle}>🛸 {t('auth.login')}</h2>
            <form onSubmit={handleLogin} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={styles.input}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={styles.input}
                  required
                  autoComplete="current-password"
                />
              </div>
              <NeonButton type="submit" variant="primary" size="large" fullWidth disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.login')}
              </NeonButton>
              <div className={styles.authSwitch}>
                <span>{t('auth.noAccount')}</span>{' '}
                <button type="button" className={styles.linkBtn} onClick={() => { setAuthMode('signup'); setError(''); }}>
                  {t('auth.signupLink')}
                </button>
              </div>
            </form>
          </div>
        )}

        {authMode === 'signup' && (
          <div className={styles.authCard}>
            <button className={styles.backBtn} onClick={handleBackToHero}>
              ← {t('common.back')}
            </button>
            <h2 className={styles.authTitle}>🚀 {t('auth.signup')}</h2>
            <form onSubmit={handleSignup} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.parentName')}</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={t('auth.namePlaceholder')}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={styles.input}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={styles.input}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={styles.input}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <NeonButton type="submit" variant="success" size="large" fullWidth disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.signup')}
              </NeonButton>
              <div className={styles.authSwitch}>
                <span>{t('auth.hasAccount')}</span>{' '}
                <button type="button" className={styles.linkBtn} onClick={() => { setAuthMode('login'); setError(''); }}>
                  {t('auth.loginLink')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
