export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'paid';
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

const API_BASE = '/api';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>('/admin/users');
}

export async function setAdminUserTier(
  id: string,
  tier: 'free' | 'paid',
): Promise<{ message: string; user: AdminUser }> {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${id}/tier`,
    {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    },
  );
}
