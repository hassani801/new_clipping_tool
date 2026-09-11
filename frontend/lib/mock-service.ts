import {
  UserProfile,
  VideoProject,
  GeneratedClip,
  CreateClipFormData,
  TierType,
} from './types';
import {
  INITIAL_USER,
  INITIAL_PROJECTS,
  INITIAL_CLIPS_PROJECT_1,
  INITIAL_CLIPS_PROJECT_2,
} from './mock-data';

const STORAGE_KEYS = {
  USER: 'cliptor_user_profile',
  PROJECTS: 'cliptor_projects',
  CLIPS: 'cliptor_clips',
  CURRENT_JOB: 'cliptor_active_processing_job',
};

/**
 * Demo mode is strictly opt-in (NEXT_PUBLIC_DEMO_MODE=true). When off, the
 * mock data layer returns empty/null results so a broken backend connection
 * can never be masked by fabricated data.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

// In-memory fallback
let memoryUser: UserProfile = { ...INITIAL_USER };
let memoryProjects: VideoProject[] = [...INITIAL_PROJECTS];
let memoryClips: GeneratedClip[] = [
  ...INITIAL_CLIPS_PROJECT_1,
  ...INITIAL_CLIPS_PROJECT_2,
];

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Initialise storage if empty (demo mode only)
export function initializeMockStorage(): void {
  if (!isDemoMode() || !isClient()) return;
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    saveToStorage(STORAGE_KEYS.USER, INITIAL_USER);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    saveToStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIPS)) {
    saveToStorage(STORAGE_KEYS.CLIPS, memoryClips);
  }
}

export const MockService = {
  // --- USER PROFILE & SUBSCRIPTION ---
  async getUser(): Promise<UserProfile | null> {
    if (!isDemoMode()) return null;
    await new Promise((r) => setTimeout(r, 60));
    return loadFromStorage<UserProfile>(STORAGE_KEYS.USER, memoryUser);
  },

  async setUserTier(tier: TierType): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 120));
    const current = await this.getUser();
    if (!current) {
      throw new Error('Demo mode is disabled — tier changes are not available.');
    }
    const updated: UserProfile = {
      ...current,
      tier,
      creditsMax: tier === 'pro' ? 50 : 3,
    };
    saveToStorage(STORAGE_KEYS.USER, updated);
    memoryUser = updated;
    return updated;
  },

  async useCredit(): Promise<UserProfile> {
    const current = await this.getUser();
    if (!current) {
      throw new Error('Demo mode is disabled — credits are not tracked.');
    }
    const updated: UserProfile = {
      ...current,
      creditsUsed: current.creditsUsed + 1,
    };
    saveToStorage(STORAGE_KEYS.USER, updated);
    memoryUser = updated;
    return updated;
  },

  // --- PROJECTS ---
  async getProjects(): Promise<VideoProject[]> {
    if (!isDemoMode()) return [];
    await new Promise((r) => setTimeout(r, 80));
    return loadFromStorage<VideoProject[]>(STORAGE_KEYS.PROJECTS, memoryProjects);
  },

  async getProjectById(id: string): Promise<VideoProject | null> {
    await new Promise((r) => setTimeout(r, 80));
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  async createProjectFromForm(formData: CreateClipFormData): Promise<{ project: VideoProject; generatedClips: GeneratedClip[] }> {
    await new Promise((r) => setTimeout(r, 150));
    const newProjectId = `proj_${Date.now()}`;
    const title = formData.sourceType === 'youtube'
      ? (formData.youtubeUrl.includes('v=') ? `YouTube Video (${formData.youtubeUrl.slice(-11)})` : 'Imported YouTube Creator Video')
      : (formData.uploadedFileName || 'Uploaded Video Stream');

    const clipCount = formData.clipCount || 3;
    const generatedClips: GeneratedClip[] = [];

    const hookTemplates = [
      {
        title: 'The Uncomfortable Truth About High Achievers',
        hook: '"Most successful people aren\'t smarter than you, they just built an environment where failure hurts less."',
        snippet: 'Most successful people aren\'t smarter than you, they just built an environment where failure hurts less. When friction on bad habits goes up 20%, output doubles.',
        viral: 98,
        tags: ['mindset', 'habits', 'success'],
        thumb: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Why 99% of Content Fails the First 3 Seconds',
        hook: '"If you introduce yourself or your channel in the first line, 80% of viewers swipe away before you breathe."',
        snippet: 'If you introduce yourself or your channel in the first line, 80% of viewers swipe away before you breathe. Cut the throat-clearing, jump directly into the thesis.',
        viral: 95,
        tags: ['creator', 'algorithm', 'virality'],
        thumb: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'The 1 Habit That Replaced 4 Hours of Meetings',
        hook: '"Async video memos will replace 90% of your Zoom calendar by the end of this year."',
        snippet: 'Async video memos will replace 90% of your Zoom calendar by the end of this year. Record 90 seconds, drop the link, and let teammates respond in their peak flow state.',
        viral: 92,
        tags: ['remote', 'productivity', 'leadership'],
        thumb: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'How Neural Networks Think in High-Dimensional Geometry',
        hook: '"AI doesn’t think in words or pixels—it maps semantic concepts into 12,000-dimensional coordinate space."',
        snippet: 'AI doesn’t think in words or pixels—it maps semantic concepts into 12,000-dimensional coordinate space. When you query it, you are rotating a hyper-dimensional prism.',
        viral: 96,
        tags: ['ai', 'tech', 'datascience'],
        thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'The Psychology of Instant Buying Decisions',
        hook: '"People buy on emotional contrast, not logical utility. Here is how to frame it."',
        snippet: 'People buy on emotional contrast, not logical utility. When you contrast the pain of inaction against the simplicity of the fix, conversion jumps 340%.',
        viral: 91,
        tags: ['sales', 'psychology', 'growth'],
        thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
      },
    ];

    for (let i = 0; i < clipCount; i++) {
      const template = hookTemplates[i % hookTemplates.length];
      const clip: GeneratedClip = {
        id: `clip_${Date.now()}_${i + 1}`,
        projectId: newProjectId,
        title: `${template.title} #${i + 1}`,
        summary: `AI extracted golden moment highlighting ${template.tags.join(', ')}.`,
        hookSentence: template.hook,
        viralScore: Math.min(99, template.viral + (i % 3)),
        hookScore: 92 + (i % 7),
        flowScore: 90 + (i % 8),
        durationSeconds: 30 + (i * 6) % 25,
        aspectRatio: formData.aspectRatio || '9:16',
        thumbnail: template.thumb,
        captionStyle: formData.captionStyle || 'karaoke',
        transcriptExcerpt: template.snippet,
        tags: template.tags,
        startTime: 60 * (i + 1),
        endTime: 60 * (i + 1) + 35,
        publishedPlatforms: [],
        viewsEstimate: '200K - 850K',
      };
      generatedClips.push(clip);
    }

    const newProject: VideoProject = {
      id: newProjectId,
      title,
      sourceType: formData.sourceType,
      sourceUrl: formData.youtubeUrl,
      fileName: formData.uploadedFileName,
      category: formData.category || 'podcast',
      durationSeconds: 1800,
      status: 'completed',
      thumbnail: generatedClips[0]?.thumbnail || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      createdAt: 'Just now',
      clipsCount: generatedClips.length,
      clips: generatedClips,
    };

    // Save project and clips
    const existingProjects = await this.getProjects();
    const existingClips = await this.getAllClips();

    const updatedProjects = [newProject, ...existingProjects];
    const updatedClips = [...generatedClips, ...existingClips];

    saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
    saveToStorage(STORAGE_KEYS.CLIPS, updatedClips);
    memoryProjects = updatedProjects;
    memoryClips = updatedClips;

    // Use credit
    await this.useCredit();

    return { project: newProject, generatedClips };
  },

  // --- CLIPS ---
  async getAllClips(): Promise<GeneratedClip[]> {
    if (!isDemoMode()) return [];
    await new Promise((r) => setTimeout(r, 80));
    return loadFromStorage<GeneratedClip[]>(STORAGE_KEYS.CLIPS, memoryClips);
  },

  async getClipsByProject(projectId: string): Promise<GeneratedClip[]> {
    const all = await this.getAllClips();
    return all.filter((c) => c.projectId === projectId);
  },

  async getClipById(clipId: string): Promise<GeneratedClip | null> {
    const all = await this.getAllClips();
    return all.find((c) => c.id === clipId) || null;
  },

  async updateClip(clipId: string, updates: Partial<GeneratedClip>): Promise<GeneratedClip> {
    await new Promise((r) => setTimeout(r, 100));
    const all = await this.getAllClips();
    const index = all.findIndex((c) => c.id === clipId);
    if (index === -1) throw new Error('Clip not found');

    const updated = { ...all[index], ...updates };
    all[index] = updated;

    saveToStorage(STORAGE_KEYS.CLIPS, all);
    memoryClips = all;
    return updated;
  },

  async deleteClip(clipId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 80));
    const all = await this.getAllClips();
    const filtered = all.filter((c) => c.id !== clipId);
    saveToStorage(STORAGE_KEYS.CLIPS, filtered);
    memoryClips = filtered;
  },

  async publishClip(clipId: string, platform: 'tiktok' | 'instagram' | 'youtube'): Promise<GeneratedClip> {
    await new Promise((r) => setTimeout(r, 300));
    const clip = await this.getClipById(clipId);
    if (!clip) throw new Error('Clip not found');

    const currentPlatforms = clip.publishedPlatforms || [];
    if (!currentPlatforms.includes(platform)) {
      currentPlatforms.push(platform);
    }
    return this.updateClip(clipId, { publishedPlatforms: currentPlatforms });
  },

  // Temporary active job state for generation screen
  setActiveProcessingJob(formData: CreateClipFormData): void {
    if (!isClient()) return;
    saveToStorage(STORAGE_KEYS.CURRENT_JOB, formData);
  },

  getActiveProcessingJob(): CreateClipFormData | null {
    if (!isDemoMode()) return null;
    return loadFromStorage<CreateClipFormData | null>(STORAGE_KEYS.CURRENT_JOB, null);
  },

  clearActiveProcessingJob(): void {
    if (!isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_JOB);
  },
};
