import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  isBackendEnabled,
  apiLogin,
  apiSignup,
  apiGetChildren,
  apiCreateChild,
  apiGetProgress,
  apiLogActivity,
  apiGetActivities,
  setToken,
  clearToken,
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
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

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [activeChild, setActiveChildState] = useState<ChildProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("starCadetUser");
    const storedActiveChild = localStorage.getItem("starCadetActiveChild");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ParentUser;
        setUser(parsed);
        if (storedActiveChild) {
          const child = parsed.children.find((c) => c.id === storedActiveChild);
          if (child) setActiveChildState(child);
        }
      } catch {
        localStorage.removeItem("starCadetUser");
      }
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage
  const persistUser = useCallback((u: ParentUser) => {
    setUser(u);
    localStorage.setItem("starCadetUser", JSON.stringify(u));
  }, []);

  // ========================
  // LOGIN
  // ========================
  const login = useCallback(
    async (email: string, password: string) => {
      if (isBackendEnabled) {
        // --- Backend mode: call API ---
        const res = await apiLogin(email, password);
        setToken(res.token);

        // Fetch children and their progress
        const apiChildren = await apiGetChildren();
        const fullChildren: ChildProfile[] = await Promise.all(
          apiChildren.map(async (c) => {
            const progress = await apiGetProgress(c.id);
            let activities: ActivityEntry[] = [];
            try {
              const rawActs = await apiGetActivities(c.id);
              activities = rawActs.map((a) => ({
                id: a.id,
                date: a.createdAt,
                type: a.type as "reading" | "counting",
                module: a.module,
                score: a.score,
                xpEarned: a.xpEarned,
                timeSpentSeconds: a.timeSpentSeconds,
              }));
            } catch {
              /* empty */
            }

            return {
              id: c.id,
              name: c.name,
              age: c.age,
              avatarColor: c.avatarColor,
              xp: progress.xp,
              level: progress.level,
              rank: progress.rank,
              language: (c.language || "en") as "en" | "es",
              streakDays: progress.streakDays,
              missionsCompleted: progress.missionsCompleted,
              badges: [],
              skills: progress.skills,
              activityLog: activities,
            };
          })
        );

        const parentUser: ParentUser = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          children: fullChildren,
          createdAt: res.user.createdAt,
        };
        persistUser(parentUser);
      } else {
        // --- Local mode: localStorage ---
        // In production, this would be an API call with JWT
        // For demo, we check localStorage
        const stored = localStorage.getItem("starCadetUsers");
        const users: ParentUser[] = stored ? JSON.parse(stored) : [];
        const found = users.find((u) => u.email === email);
        if (found) {
          persistUser(found);
        } else {
          throw new Error("Invalid credentials");
        }
      }
    },
    [persistUser]
  );

  // ========================
  // SIGNUP
  // ========================
  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      if (isBackendEnabled) {
        const res = await apiSignup(email, password, name);
        setToken(res.token);
        const parentUser: ParentUser = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          children: [],
          createdAt: res.user.createdAt,
        };
        persistUser(parentUser);
      } else {
        const stored = localStorage.getItem("starCadetUsers");
        const users: ParentUser[] = stored ? JSON.parse(stored) : [];
        if (users.find((u) => u.email === email)) {
          throw new Error("Account already exists");
        }
        const newUser: ParentUser = {
          id: generateId(),
          email,
          name,
          children: [],
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem("starCadetUsers", JSON.stringify(users));
        persistUser(newUser);
      }
    },
    [persistUser]
  );

  // ========================
  // LOGOUT
  // ========================
  const logout = useCallback(() => {
    setUser(null);
    setActiveChildState(null);
    localStorage.removeItem("starCadetUser");
    localStorage.removeItem("starCadetActiveChild");
    clearToken();
  }, []);

  // ========================
  // ADD CHILD
  // ========================
  const addChild = useCallback(
    async (name: string, age: 3 | 4 | 5) => {
      if (!user) return;

      if (isBackendEnabled) {
        const apiChild = await apiCreateChild(name, age);
        const newChild: ChildProfile = {
          id: apiChild.id,
          name: apiChild.name,
          age: apiChild.age,
          avatarColor: apiChild.avatarColor,
          xp: 0,
          level: 1,
          rank: "beginnerExplorer",
          language: (apiChild.language || "en") as "en" | "es",
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
      } else {
        const newChild: ChildProfile = {
          id: generateId(),
          name,
          age,
          avatarColor:
            AVATAR_COLORS[user.children.length % AVATAR_COLORS.length],
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
        const updated = { ...user, children: [...user.children, newChild] };
        persistUser(updated);
        // Also update in users array
        const stored = localStorage.getItem("starCadetUsers");
        const users: ParentUser[] = stored ? JSON.parse(stored) : [];
        const idx = users.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          users[idx] = updated;
          localStorage.setItem("starCadetUsers", JSON.stringify(users));
        }
      }
    },
    [user, persistUser]
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
        localStorage.setItem("starCadetActiveChild", childId);
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
        const updated = { ...prevUser, children: updatedChildren };
        localStorage.setItem("starCadetUser", JSON.stringify(updated));
        // Sync to users array in local mode
        if (!isBackendEnabled) {
          const stored = localStorage.getItem("starCadetUsers");
          const users: ParentUser[] = stored ? JSON.parse(stored) : [];
          const idx = users.findIndex((u) => u.id === prevUser.id);
          if (idx !== -1) {
            users[idx] = updated;
            localStorage.setItem("starCadetUsers", JSON.stringify(users));
          }
        }
        return updated;
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
