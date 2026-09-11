import { UserProfile } from './types';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  tier?: string;
  subscriptionStatus?: string;
  isAdmin?: boolean;
}

export interface JobClip {
  id: string;
  filename: string;
  title: string;
  duration: number;
  viralityScore: number;
  hookSummary?: string;
  tags?: string[];
  url?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  startTime?: number;
  endTime?: number;
}

export interface JobOptions {
  category?: string;
  clipCount?: number;
  aspectRatio?: string;
  autoReframe?: boolean;
  highlightSensitivity?: string;
  captionPreset?: string;
  tier?: string;
  transcriptionProvider?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface JobInfo {
  id: string;
  userId: string;
  sourceUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  currentStage: string;
  progressPercent: number;
  options?: JobOptions | null;
  clipsData?: JobClip[] | null;
  engineJobId?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface CreateJobInput {
  sourceUrl: string;
  category?: string;
  clipCount?: number;
  aspectRatio?: string;
  autoReframe?: boolean;
  highlightSensitivity?: string;
  captionPreset?: string;
}

export interface ApiError extends Error {
  status?: number;
}

const API_BASE = '/api';

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data?.message)) {
        message = data.message.join(', ');
      }
    } catch {
      // keep default message
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function signup(
  email: string,
  password: string,
  name?: string,
): Promise<{ message: string; user: AuthUser; accessToken: string }> {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(name ? { name } : {}) }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<{ message: string; user: AuthUser; accessToken: string }> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<{ message: string }> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    return await apiRequest<AuthUser>('/auth/me');
  } catch (err) {
    if ((err as ApiError)?.status === 401) return null;
    throw err;
  }
}

// ── Jobs / clips ────────────────────────────────────────────────────────────

export async function createJob(
  input: CreateJobInput,
): Promise<{ message: string; jobId: string; job: JobInfo }> {
  return apiRequest('/jobs', { method: 'POST', body: JSON.stringify(input) });
}

export async function getJobs(): Promise<JobInfo[]> {
  const data = await apiRequest<{ count: number; jobs: JobInfo[] }>('/jobs');
  return data.jobs;
}

export async function getJob(id: string): Promise<JobInfo> {
  return apiRequest<JobInfo>(`/jobs/${id}`);
}

export async function getJobClips(id: string): Promise<JobClip[]> {
  const data = await apiRequest<{ jobId: string; count: number; clips: JobClip[] }>(
    `/jobs/${id}/clips`,
  );
  return data.clips;
}

/**
 * Maps a backend user record onto the frontend's display profile shape.
 */
export function toUserProfile(u: AuthUser): UserProfile {
  return {
    id: u.id,
    name: u.name || u.email.split('@')[0] || 'Creator',
    email: u.email,
    tier: u.tier === 'paid' ? 'pro' : 'free',
    creditsUsed: 0,
    creditsMax: 0,
    avatarUrl: '',
    joinedDate: '',
    isAdmin: Boolean(u.isAdmin),
  };
}
