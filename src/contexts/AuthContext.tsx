import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  isBackendEnabled,
  apiLogActivity,
  type ApiActivityInput,
} from "../lib/api";

export interface ChildProfile {
  id: string;
  name: string;
  age: 3 | 4 | 5;
  avatarColor: string;
  xp: number;
  level: number;
  rank: string;
  language: "en" | "es";
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
  type: "reading" | "counting";
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
  logout: () => void;
  addChild: (name: string, age: 3 | 4 | 5) => void;
  setActiveChild: (childId: string) => void;
  updateChildXP: (xp: number) => void;
  addActivityEntry: (entry: Omit<ActivityEntry, "id" | "date">) => void;
  updateChildSkill: (
    skill: keyof ChildProfile["skills"],
    value: number
  ) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// XP thresholds for each level
export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getRankFromLevel(level: number): string {
  if (level <= 5) return "beginnerExplorer";
  if (level <= 10) return "spaceNewbie";
  if (level <= 20) return "spaceExpert";
  return "pilotMothership";
}

const AVATAR_COLORS = [
  "#ff6fd8",
  "#3813c2",
  "#00d4ff",
  "#ff9500",
  "#00e676",
  "#ff4081",
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface AuthProviderProps {
  children: ReactNode;
}

const GUEST_USER: ParentUser = {
  id: "guest",
  email: "",
  name: "Guest",
  children: [],
  createdAt: new Date().toISOString(),
};

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<ParentUser | null>(GUEST_USER);
  const [activeChild, setActiveChildState] = useState<ChildProfile | null>(
    null
  );

  // ========================
  // LOGOUT — resets to fresh guest state
  // ========================
  const logout = useCallback(() => {
    setUser({ ...GUEST_USER, createdAt: new Date().toISOString() });
    setActiveChildState(null);
  }, []);

  // ========================
  // ADD CHILD
  // ========================
  const addChild = useCallback(
    (_name: string, _age: 3 | 4 | 5) => {
      const name = _name;
      const age = _age;
      setUser((prev) => {
        if (!prev) return prev;
        const newChild: ChildProfile = {
          id: generateId(),
          name,
          age,
          avatarColor:
            AVATAR_COLORS[prev.children.length % AVATAR_COLORS.length],
          xp: 0,
          level: 1,
          rank: "beginnerExplorer",
          language: "en",
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
        return { ...prev, children: [...prev.children, newChild] };
      });
    },
    []
  );

  // ========================
  // SET ACTIVE CHILD
  // ========================
  const setActiveChild = useCallback(
    (childId: string) => {
      if (!user) return;
      const child = user.children.find((c) => c.id === childId);
      if (child) {
        setActiveChildState(child);
      }
    },
    [user]
  );

  // Helper: apply a child update using functional state updates so that
  // sequential calls (e.g. updateChildXP + updateChildSkill + addActivityEntry)
  // compose correctly instead of overwriting each other's changes.
  const applyChildUpdate = useCallback(
    (childId: string, updater: (child: ChildProfile) => ChildProfile) => {
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        const updatedChildren = prevUser.children.map((c) =>
          c.id === childId ? updater(c) : c
        );
        return { ...prevUser, children: updatedChildren };
      });
      setActiveChildState((prevChild) => {
        if (!prevChild || prevChild.id !== childId) return prevChild;
        return updater(prevChild);
      });
    },
    []
  );

  // ========================
  // UPDATE XP
  // ========================
  const updateChildXP = useCallback(
    (xpToAdd: number) => {
      if (!activeChild) return;
      applyChildUpdate(activeChild.id, (child) => {
        const newXP = child.xp + xpToAdd;
        const newLevel = getLevelFromXP(newXP);
        const newRank = getRankFromLevel(newLevel);
        return {
          ...child,
          xp: newXP,
          level: newLevel,
          rank: newRank,
          missionsCompleted: child.missionsCompleted + 1,
        };
      });
    },
    [activeChild, applyChildUpdate]
  );

  // ========================
  // ADD ACTIVITY ENTRY
  // ========================
  const addActivityEntry = useCallback(
    (entry: Omit<ActivityEntry, "id" | "date">) => {
      if (!activeChild) return;

      // Fire-and-forget API call if backend is enabled
      if (isBackendEnabled) {
        const apiEntry: ApiActivityInput = {
          type: entry.type,
          module: entry.module,
          score: entry.score,
          xpEarned: entry.xpEarned,
          timeSpentSeconds: entry.timeSpentSeconds,
        };
        apiLogActivity(activeChild.id, apiEntry).catch(console.error);
      }

      applyChildUpdate(activeChild.id, (child) => {
        const newEntry: ActivityEntry = {
          ...entry,
          id: generateId(),
          date: new Date().toISOString(),
        };
        return {
          ...child,
          activityLog: [...child.activityLog, newEntry],
        };
      });
    },
    [activeChild, applyChildUpdate]
  );

  // ========================
  // UPDATE SKILL
  // ========================
  const updateChildSkill = useCallback(
    (skill: keyof ChildProfile["skills"], value: number) => {
      if (!activeChild) return;
      applyChildUpdate(activeChild.id, (child) => ({
        ...child,
        skills: {
          ...child.skills,
          [skill]: Math.min(100, child.skills[skill] + value),
        },
      }));
    },
    [activeChild, applyChildUpdate]
  );
  return (
    <AuthContext.Provider
      value={{
        user,
        activeChild,
        isAuthenticated: !!user,
        isLoading: false,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
