export interface CampaignListing {
  id: string;
  platformName: string;
  platformLogoUrl: string | null;
  campaignTitle: string;
  description: string;
  sourceVideoUrl: string | null;
  ratePerThousandViews: string;
  requirements: string | null;
  externalJoinUrl: string;
  externalSubmissionUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListingInput {
  platformName: string;
  platformLogoUrl?: string;
  campaignTitle: string;
  description: string;
  sourceVideoUrl?: string | null;
  ratePerThousandViews: string;
  requirements?: string | null;
  externalJoinUrl: string;
  externalSubmissionUrl?: string | null;
  isActive?: boolean;
}

export interface CampaignSubmissionLog {
  id: string;
  userId: string;
  campaignListingId: string | null;
  freeTextPlatformName: string | null;
  clipJobId: string | null;
  postUrl: string;
  submittedAt: string;
  notes: string | null;
  campaignListing?: CampaignListing | null;
}

export interface CreateSubmissionInput {
  campaignListingId?: string;
  freeTextPlatformName?: string;
  postUrl: string;
  clipJobId?: string;
  notes?: string;
}

export interface ApiUser {
  id: string;
  email: string;
  isAdmin?: boolean;
  tier?: string;
  [key: string]: unknown;
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
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ── Public listing directory ────────────────────────────────────────────────

export async function getActiveCampaignListings(
  platformName?: string,
): Promise<CampaignListing[]> {
  const q = platformName
    ? `?platformName=${encodeURIComponent(platformName)}`
    : '';
  return apiRequest<CampaignListing[]>(`/campaign-listings${q}`);
}

export async function getCampaignListing(id: string): Promise<CampaignListing> {
  return apiRequest<CampaignListing>(`/campaign-listings/${id}`);
}

// ── User-facing submissions ─────────────────────────────────────────────────

export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<CampaignSubmissionLog> {
  return apiRequest<CampaignSubmissionLog>('/campaign-submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMySubmissions(): Promise<CampaignSubmissionLog[]> {
  return apiRequest<CampaignSubmissionLog[]>('/campaign-submissions/mine');
}

export async function deleteSubmission(
  id: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/campaign-submissions/${id}`, {
    method: 'DELETE',
  });
}

// ── Admin listing management ────────────────────────────────────────────────

export async function getAdminListings(): Promise<CampaignListing[]> {
  return apiRequest<CampaignListing[]>('/admin/campaign-listings');
}

export async function createAdminListing(
  input: CampaignListingInput,
): Promise<CampaignListing> {
  return apiRequest<CampaignListing>('/admin/campaign-listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminListing(
  id: string,
  input: Partial<CampaignListingInput>,
): Promise<CampaignListing> {
  return apiRequest<CampaignListing>(`/admin/campaign-listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminListing(
  id: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/admin/campaign-listings/${id}`, {
    method: 'DELETE',
  });
}

// ── Current user (used for admin visibility) ────────────────────────────────

export async function getCurrentUser(): Promise<ApiUser> {
  return apiRequest<ApiUser>('/auth/me');
}
