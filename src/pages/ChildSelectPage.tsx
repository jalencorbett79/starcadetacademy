import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import NeonButton from '../components/NeonButton';
import StarfieldCanvas from '../components/StarfieldCanvas';
import styles from './ChildSelectPage.module.css';

interface ChildSelectPageProps {
  onNavigate: (page: string) => void;
}

function ChildSelectPage({ onNavigate }: ChildSelectPageProps): React.ReactElement {
  const { user, addChild, setActiveChild } = useAuth();
  const { t } = useLanguage();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<3 | 4 | 5>(3);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const hasChildren = (user?.children.length ?? 0) > 0;

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (childName.trim()) {
      addChild(childName.trim(), childAge);
      setChildName('');
      setPendingNavigation(true);
    }
  };

  const handleSelectChild = (childId: string) => {
    setActiveChild(childId);
    onNavigate('missions');
  };

  // Navigate to missions after a child has been added
  React.useEffect(() => {
    if (!pendingNavigation) return;
    if (!user || user.children.length === 0) return;
    setPendingNavigation(false);
    const latest = user.children[user.children.length - 1];
    setActiveChild(latest.id);
    onNavigate('missions');
  }, [pendingNavigation, user, setActiveChild, onNavigate]);

  return (
    <div className={styles.page}>
      <StarfieldCanvas speed={0.2} starCount={200} />
      <div className={styles.content}>
        <h1 className={styles.title}>👨‍🚀 {t('missions.selectAge')}</h1>
        <p className={styles.subtitle}>{t('auth.childName')}</p>

        {hasChildren && (
          <div className={styles.children}>
            {user?.children.map((child) => (
              <button
                key={child.id}
                className={styles.childCard}
                onClick={() => handleSelectChild(child.id)}
                style={{ borderColor: child.avatarColor }}
              >
                <div className={styles.avatar} style={{ background: child.avatarColor }}>
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.childInfo}>
                  <span className={styles.childName}>{child.name}</span>
                  <span className={styles.childAge}>
                    {t(`missions.age${child.age}`)}
                  </span>
                  <span className={styles.childXP}>⭐ {child.xp} XP</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!hasChildren && (
          <form className={styles.addForm} onSubmit={handleAddChild}>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder={t('auth.childName')}
              className={styles.input}
              required
              autoFocus
            />
            <div className={styles.ageSelector}>
              {([3, 4, 5] as const).map((age) => (
                <button
                  key={age}
                  type="button"
                  className={`${styles.ageBtn} ${childAge === age ? styles.ageBtnActive : ''}`}
                  onClick={() => setChildAge(age)}
                >
                  {t(`missions.age${age}`)}
                </button>
              ))}
            </div>
            <div className={styles.formActions}>
              <NeonButton type="submit" variant="success" size="medium">
                🚀 {t('missions.start')}
              </NeonButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChildSelectPage;
