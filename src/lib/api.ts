/**
 * API client for Star Cadet Academy serverless backend.
 *
 * Supports two modes:
 *   1. Backend mode (VITE_API_URL is set) — calls /api/* serverless functions with JWT
 *   2. Local mode (no VITE_API_URL) — falls back to localStorage (offline / demo)
 *
 * The AuthContext checks which mode to use automatically.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/** True when serverless backend is configured */
export const isBackendEnabled = !!API_BASE;

function getToken(): string | null {
  return localStorage.getItem('starCadetToken');
}

export function setToken(token: string): void {
  localStorage.setItem('starCadetToken', token);
}

export function clearToken(): void {
  localStorage.removeItem('starCadetToken');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ========================
// Auth API
// ========================

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
}

export async function apiSignup(email: string, password: string, name: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe() {
  return request<{ id: string; email: string; name: string; role: string; createdAt: string }>('/api/auth/me');
}

// ========================
// Children API
// ========================

export interface ApiChild {
  id: string;
  parentId: string;
  name: string;
  age: 3 | 4 | 5;
  avatarColor: string;
  language: string;
  createdAt: string;
}

export async function apiGetChildren(): Promise<ApiChild[]> {
  return request<ApiChild[]>('/api/children');
}

export async function apiCreateChild(name: string, age: 3 | 4 | 5): Promise<ApiChild> {
  return request<ApiChild>('/api/children', {
    method: 'POST',
    body: JSON.stringify({ name, age }),
  });
}

export async function apiUpdateChild(id: string, data: { name?: string; age?: number; language?: string }): Promise<ApiChild> {
  return request<ApiChild>(`/api/children/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteChild(id: string): Promise<void> {
  await request<{ message: string }>(`/api/children/${id}`, { method: 'DELETE' });
}

// ========================
// Progress API
// ========================

export interface ApiProgress {
  childId: string;
  xp: number;
  level: number;
  rank: string;
  missionsCompleted: number;
  streakDays: number;
  skills: {
    letterRecognition: number;
    phonics: number;
    sightWords: number;
    counting: number;
    addition: number;
  };
}

export async function apiGetProgress(childId: string): Promise<ApiProgress> {
  return request<ApiProgress>(`/api/progress/${childId}`);
}

export interface ApiActivityInput {
  type: 'reading' | 'counting';
  module: string;
  score: number;
  xpEarned: number;
  timeSpentSeconds: number;
  skillUpdates?: Record<string, number>;
}

export async function apiLogActivity(childId: string, data: ApiActivityInput) {
  return request<{ activity: unknown; xp: number; level: number; rank: string }>(
    `/api/progress/${childId}/activity`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function apiGetActivities(childId: string) {
  return request<Array<{
    id: string;
    childId: string;
    type: string;
    module: string;
    score: number;
    xpEarned: number;
    timeSpentSeconds: number;
    createdAt: string;
  }>>(`/api/progress/${childId}/activity`);
}
