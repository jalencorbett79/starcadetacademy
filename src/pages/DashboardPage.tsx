import React from 'react';
import { useAuth, type ChildProfile } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import NavBar from '../components/NavBar';
import NeonButton from '../components/NeonButton';
import styles from './DashboardPage.module.css';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

function DashboardPage({ onNavigate }: DashboardPageProps): React.ReactElement {
  const { activeChild, user } = useAuth();
  const { t } = useLanguage();

  const child = activeChild;
  if (!child || !user) {
    onNavigate('childSelect');
    return <div />;
  }

  const totalTime = child.activityLog.reduce((sum, e) => sum + e.timeSpentSeconds, 0);
  const avgScore = child.activityLog.length > 0
    ? Math.round(child.activityLog.reduce((sum, e) => sum + e.score, 0) / child.activityLog.length * 20)
    : 0;

  const weakAreas = getWeakAreas(child, t);

  return (
    <div className={styles.page}>
      <NavBar currentPage="dashboard" onNavigate={onNavigate} />

      <div className={styles.content}>
        <h1 className={styles.title}>📊 {t('dashboard.title')}</h1>
        <p className={styles.childName}>
          {t('profile.title')}: <strong>{child.name}</strong>
        </p>

        {/* Overview Cards */}
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <span className={styles.overviewIcon}>⭐</span>
            <span className={styles.overviewValue}>{child.xp}</span>
            <span className={styles.overviewLabel}>{t('dashboard.totalXP')}</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewIcon}>🎮</span>
            <span className={styles.overviewValue}>{child.missionsCompleted}</span>
            <span className={styles.overviewLabel}>{t('dashboard.missionsCompleted')}</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewIcon}>🔥</span>
            <span className={styles.overviewValue}>{child.streakDays}</span>
            <span className={styles.overviewLabel}>{t('dashboard.streak')}</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewIcon}>⏱️</span>
            <span className={styles.overviewValue}>{formatTime(totalTime)}</span>
            <span className={styles.overviewLabel}>{t('dashboard.time')}</span>
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📖 {t('dashboard.readingSkills')}</h2>
          <div className={styles.skillBars}>
            <SkillBar label={t('dashboard.letterRecognition')} value={child.skills.letterRecognition} color="#ff6fd8" />
            <SkillBar label={t('dashboard.phonics')} value={child.skills.phonics} color="#00d4ff" />
            <SkillBar label={t('dashboard.sightWords')} value={child.skills.sightWords} color="#00e676" />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🔢 {t('dashboard.countingSkills')}</h2>
          <div className={styles.skillBars}>
            <SkillBar label={t('dashboard.counting120')} value={child.skills.counting} color="#ff9500" />
            <SkillBar label={t('dashboard.addition')} value={child.skills.addition} color="#aa66ff" />
          </div>
        </div>

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>⚠️ {t('dashboard.weakAreas')}</h2>
            <div className={styles.weakList}>
              {weakAreas.map((area) => (
                <div key={area} className={styles.weakItem}>
                  {area}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 {t('dashboard.progress')}</h2>
          {child.activityLog.length === 0 ? (
            <p className={styles.emptyLog}>No activity yet. Start a mission!</p>
          ) : (
            <div className={styles.activityLog}>
              {child.activityLog.slice(-10).reverse().map((entry) => (
                <div key={entry.id} className={styles.logEntry}>
                  <span className={styles.logType}>
                    {entry.type === 'reading' ? '📖' : '🔢'}
                  </span>
                  <span className={styles.logModule}>{entry.module}</span>
                  <span className={styles.logScore}>{entry.score} pts</span>
                  <span className={styles.logXP}>+{entry.xpEarned} XP</span>
                  <span className={styles.logDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download Report */}
        <div className={styles.downloadSection}>
          <NeonButton
            variant="secondary"
            size="medium"
            onClick={() => downloadReport(child, t)}
          >
            📄 {t('dashboard.downloadReport')}
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  return (
    <div className={styles.skillRow}>
      <span className={styles.skillName}>{label}</span>
      <div className={styles.skillBar}>
        <div className={styles.skillFill} style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={styles.skillValue}>{value}%</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function getWeakAreas(child: ChildProfile, t: (key: string) => string): string[] {
  const weak: string[] = [];
  const threshold = 30;

  if (child.skills.letterRecognition < threshold) weak.push(t('dashboard.letterRecognition'));
  if (child.skills.phonics < threshold) weak.push(t('dashboard.phonics'));
  if (child.skills.sightWords < threshold) weak.push(t('dashboard.sightWords'));
  if (child.skills.counting < threshold) weak.push(t('dashboard.counting120'));
  if (child.skills.addition < threshold) weak.push(t('dashboard.addition'));

  return weak;
}

function downloadReport(child: ChildProfile, t: (key: string) => string): void {
  const report = `
${t('dashboard.title')}
============================
${t('profile.title')}: ${child.name}
${t('xp.level')}: ${child.level}
${t('dashboard.totalXP')}: ${child.xp}
${t('dashboard.missionsCompleted')}: ${child.missionsCompleted}

${t('dashboard.skills')}
----------------------------
${t('dashboard.letterRecognition')}: ${child.skills.letterRecognition}%
${t('dashboard.phonics')}: ${child.skills.phonics}%
${t('dashboard.sightWords')}: ${child.skills.sightWords}%
${t('dashboard.counting120')}: ${child.skills.counting}%
${t('dashboard.addition')}: ${child.skills.addition}%

${t('dashboard.progress')}
----------------------------
${child.activityLog.map(e => `${new Date(e.date).toLocaleDateString()} | ${e.module} | Score: ${e.score} | +${e.xpEarned} XP`).join('\n')}

Generated: ${new Date().toLocaleString()}
  `.trim();

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${child.name}_progress_report.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default DashboardPage;
