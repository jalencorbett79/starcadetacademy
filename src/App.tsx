import React, { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ChildSelectPage from './pages/ChildSelectPage';
import MissionsPage from './pages/MissionsPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import MusicToggle from './components/MusicToggle';

type Page = 'landing' | 'childSelect' | 'missions' | 'profile' | 'dashboard' | 'home';

function AppContent(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  switch (currentPage) {
    case 'landing':
      return <LandingPage onNavigate={handleNavigate} />;
    case 'childSelect':
      return <ChildSelectPage onNavigate={handleNavigate} />;
    case 'missions':
      return <MissionsPage onNavigate={handleNavigate} />;
    case 'profile':
      return <ProfilePage onNavigate={handleNavigate} />;
    case 'dashboard':
      return <DashboardPage onNavigate={handleNavigate} />;
    case 'home':
      return <ChildSelectPage onNavigate={handleNavigate} />;
    default:
      return <LandingPage onNavigate={handleNavigate} />;
  }
}

function App(): React.ReactElement {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
        <MusicToggle />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
