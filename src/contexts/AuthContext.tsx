import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface ChildProfile {
  id: string;
  name: string;
  age: 3 | 4 | 5;
  avatarColor: string;
  xp: number;
  level: number;
  rank: string;
  language: 'en' | 'es';
  streakDays: number;
  missionsCompleted: number;
  badges: string[];
  skills: {
    letterRecognition: number;
    phonics: number;
    sightWords: number;
    counting: number;
    addition: number;
  };
  activityLog: ActivityEntry[];
}

export interface ActivityEntry {
  id: string;
  date: string;
  type: 'reading' | 'counting';
  module: string;
  score: number;
  xpEarned: number;
  timeSpentSeconds: number;
}

export interface ParentUser {
  id: string;
  email: string;
  name: string;
  children: ChildProfile[];
  createdAt: string;
}

interface AuthContextType {
  user: ParentUser | null;
  activeChild: ChildProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  addChild: (name: string, age: 3 | 4 | 5) => void;
  setActiveChild: (childId: string) => void;
  updateChildXP: (xp: number) => void;
  addActivityEntry: (entry: Omit<ActivityEntry, 'id' | 'date'>) => void;
  updateChildSkill: (skill: keyof ChildProfile['skills'], value: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// XP thresholds for each level
function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getRankFromLevel(level: number): string {
  if (level <= 5) return 'beginnerExplorer';
  if (level <= 10) return 'spaceNewbie';
  if (level <= 20) return 'spaceExpert';
  return 'pilotMothership';
}

const AVATAR_COLORS = ['#ff6fd8', '#3813c2', '#00d4ff', '#ff9500', '#00e676', '#ff4081'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [activeChild, setActiveChildState] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('starCadetUser');
    const storedActiveChild = localStorage.getItem('starCadetActiveChild');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ParentUser;
        setUser(parsed);
        if (storedActiveChild) {
          const child = parsed.children.find(c => c.id === storedActiveChild);
          if (child) setActiveChildState(child);
        }
      } catch {
        localStorage.removeItem('starCadetUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage
  const persistUser = useCallback((u: ParentUser) => {
    setUser(u);
    localStorage.setItem('starCadetUser', JSON.stringify(u));
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // In production, this would be an API call with JWT
    // For demo, we check localStorage
    const stored = localStorage.getItem('starCadetUsers');
    const users: ParentUser[] = stored ? JSON.parse(stored) : [];
    const found = users.find(u => u.email === email);
    if (found) {
      persistUser(found);
    } else {
      throw new Error('Invalid credentials');
    }
  }, [persistUser]);

  const signup = useCallback(async (email: string, _password: string, name: string) => {
    const stored = localStorage.getItem('starCadetUsers');
    const users: ParentUser[] = stored ? JSON.parse(stored) : [];
    if (users.find(u => u.email === email)) {
      throw new Error('Account already exists');
    }
    const newUser: ParentUser = {
      id: generateId(),
      email,
      name,
      children: [],
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('starCadetUsers', JSON.stringify(users));
    persistUser(newUser);
  }, [persistUser]);

  const logout = useCallback(() => {
    setUser(null);
    setActiveChildState(null);
    localStorage.removeItem('starCadetUser');
    localStorage.removeItem('starCadetActiveChild');
  }, []);

  const addChild = useCallback((name: string, age: 3 | 4 | 5) => {
    if (!user) return;
    const newChild: ChildProfile = {
      id: generateId(),
      name,
      age,
      avatarColor: AVATAR_COLORS[user.children.length % AVATAR_COLORS.length],
      xp: 0,
      level: 1,
      rank: 'beginnerExplorer',
      language: 'en',
      streakDays: 0,
      missionsCompleted: 0,
      badges: [],
      skills: {
        letterRecognition: 0,
        phonics: 0,
        sightWords: 0,
        counting: 0,
        addition: 0,
      },
      activityLog: [],
    };
    const updated = { ...user, children: [...user.children, newChild] };
    persistUser(updated);
    // Also update in users array
    const stored = localStorage.getItem('starCadetUsers');
    const users: ParentUser[] = stored ? JSON.parse(stored) : [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem('starCadetUsers', JSON.stringify(users));
    }
  }, [user, persistUser]);

  const setActiveChild = useCallback((childId: string) => {
    if (!user) return;
    const child = user.children.find(c => c.id === childId);
    if (child) {
      setActiveChildState(child);
      localStorage.setItem('starCadetActiveChild', childId);
    }
  }, [user]);

  const updateChildXP = useCallback((xpToAdd: number) => {
    if (!user || !activeChild) return;
    const newXP = activeChild.xp + xpToAdd;
    const newLevel = getLevelFromXP(newXP);
    const newRank = getRankFromLevel(newLevel);
    const updatedChild: ChildProfile = {
      ...activeChild,
      xp: newXP,
      level: newLevel,
      rank: newRank,
      missionsCompleted: activeChild.missionsCompleted + 1,
    };
    const updatedChildren = user.children.map(c =>
      c.id === activeChild.id ? updatedChild : c
    );
    const updated = { ...user, children: updatedChildren };
    persistUser(updated);
    setActiveChildState(updatedChild);
    // Sync to users array
    const stored = localStorage.getItem('starCadetUsers');
    const users: ParentUser[] = stored ? JSON.parse(stored) : [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem('starCadetUsers', JSON.stringify(users));
    }
  }, [user, activeChild, persistUser]);

  const addActivityEntry = useCallback((entry: Omit<ActivityEntry, 'id' | 'date'>) => {
    if (!user || !activeChild) return;
    const newEntry: ActivityEntry = {
      ...entry,
      id: generateId(),
      date: new Date().toISOString(),
    };
    const updatedChild: ChildProfile = {
      ...activeChild,
      activityLog: [...activeChild.activityLog, newEntry],
    };
    const updatedChildren = user.children.map(c =>
      c.id === activeChild.id ? updatedChild : c
    );
    const updated = { ...user, children: updatedChildren };
    persistUser(updated);
    setActiveChildState(updatedChild);
  }, [user, activeChild, persistUser]);

  const updateChildSkill = useCallback((skill: keyof ChildProfile['skills'], value: number) => {
    if (!user || !activeChild) return;
    const updatedChild: ChildProfile = {
      ...activeChild,
      skills: {
        ...activeChild.skills,
        [skill]: Math.min(100, activeChild.skills[skill] + value),
      },
    };
    const updatedChildren = user.children.map(c =>
      c.id === activeChild.id ? updatedChild : c
    );
    const updated = { ...user, children: updatedChildren };
    persistUser(updated);
    setActiveChildState(updatedChild);
  }, [user, activeChild, persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeChild,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        addChild,
        setActiveChild,
        updateChildXP,
        addActivityEntry,
        updateChildSkill,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
