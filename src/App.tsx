import React, { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ChildSelectPage from './pages/ChildSelectPage';
import MissionsPage from './pages/MissionsPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';

type Page = 'landing' | 'childSelect' | 'missions' | 'profile' | 'dashboard' | 'home';

function AppContent(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000010',
        color: '#00d4ff',
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: '0.8rem',
      }}>
        🚀 Launching...
      </div>
    );
  }

  // Route to landing if not authenticated
  if (!isAuthenticated && currentPage !== 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

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
      if (isAuthenticated) {
        return <ChildSelectPage onNavigate={handleNavigate} />;
      }
      return <LandingPage onNavigate={handleNavigate} />;
    default:
      return <LandingPage onNavigate={handleNavigate} />;
  }
}

function App(): React.ReactElement {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
