export type TierType = 'free' | 'pro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: TierType;
  creditsUsed: number;
  creditsMax: number;
  avatarUrl: string;
  joinedDate: string;
  isAdmin?: boolean;
}

export type VideoSourceType = 'youtube' | 'upload';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type CaptionStyleId = 'karaoke' | 'minimal' | 'cyberpunk';

export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface CaptionStyle {
  id: CaptionStyleId;
  name: string;
  description: string;
  previewBg: string;
  previewColor: string;
  badge: string;
}

export interface GeneratedClip {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  hookSentence: string;
  viralScore: number; // 0 - 100
  hookScore: number;  // 0 - 100
  flowScore: number;  // 0 - 100
  durationSeconds: number;
  aspectRatio: AspectRatio;
  thumbnail: string;
  captionStyle: CaptionStyleId;
  transcriptExcerpt: string;
  tags: string[];
  startTime: number; // in seconds
  endTime: number;   // in seconds
  publishedPlatforms: ('tiktok' | 'instagram' | 'youtube')[];
  downloadUrl?: string;
  viewsEstimate?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  sourceType: VideoSourceType;
  sourceUrl?: string;
  fileName?: string;
  category: 'podcast' | 'interview' | 'gaming' | 'education' | 'music';
  durationSeconds: number;
  status: JobStatus;
  thumbnail: string;
  createdAt: string;
  clipsCount: number;
  clips?: GeneratedClip[];
  processingStage?: string;
  progressPercent?: number;
}

export interface CreateClipFormData {
  sourceType: VideoSourceType;
  youtubeUrl: string;
  uploadedFileName?: string;
  uploadedFileSize?: string;
  category: 'podcast' | 'interview' | 'gaming' | 'education' | 'music';
  clipCount: number;
  captionStyle: CaptionStyleId;
  aspectRatio: AspectRatio;
  autoReframe: boolean;
  highlightSensitivity: 'balanced' | 'aggressive' | 'conservative';
}

export interface ProcessingStageInfo {
  step: number;
  title: string;
  description: string;
  durationMs: number;
}
