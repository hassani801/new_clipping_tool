import { CaptionStyle, ProcessingStageInfo } from './types';

// Central pricing constant as explicitly required by prompt
export const PRO_PRICE_PKR = 1000;
export const PRO_PRICE_ANNUAL_PKR = 9600; // ~800 PKR/mo billed annually

export const FREE_TIER_LIMITS = {
  maxVideoDurationMinutes: 10,
  maxClipsPerVideo: 3,
  monthlyVideos: 2,
  resolution: '720p',
  watermark: true,
  priorityQueue: false,
  languages: ['English'],
};

export const PRO_TIER_LIMITS = {
  maxVideoDurationMinutes: 120,
  maxClipsPerVideo: 10,
  monthlyVideos: 50,
  resolution: '1080p / 4K',
  watermark: false,
  priorityQueue: true,
  languages: ['English', 'Spanish', 'French', 'German', 'Urdu', 'Hindi', 'Arabic', 'Japanese'],
};

export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: 'karaoke',
    name: 'Karaoke Flow',
    description: 'Dynamic word-level kinetic ASS typography with smooth syllable highlighting.',
    previewBg: 'bg-slate-950',
    previewColor: 'text-emerald-400 font-bold',
    badge: 'Supported',
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    description: 'Crisp white typography with subtle drop shadow (Coming Soon).',
    previewBg: 'bg-slate-900',
    previewColor: 'text-white font-medium',
    badge: 'Coming Soon',
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Neon',
    description: 'Electric pink and cyan neon glow for energetic creator content (Coming Soon).',
    previewBg: 'bg-black',
    previewColor: 'text-fuchsia-400 font-bold tracking-wide',
    badge: 'Coming Soon',
  },
];

export const PROCESSING_STAGES: ProcessingStageInfo[] = [
  {
    step: 1,
    title: 'Downloading Source Media',
    description: 'Fetching highest-bitrate video and audio streams securely...',
    durationMs: 2500,
  },
  {
    step: 2,
    title: 'Transcribing with Whisper AI',
    description: 'Generating word-level timestamps and punctuation accuracy...',
    durationMs: 3500,
  },
  {
    step: 3,
    title: 'Detecting Golden Viral Hooks',
    description: 'Scoring emotional peaks, humor, insights, and engagement density...',
    durationMs: 4000,
  },
  {
    step: 4,
    title: 'Smart 9:16 Auto-Reframing',
    description: 'Computer vision face-tracking keeps speakers centered on mobile...',
    durationMs: 3000,
  },
  {
    step: 5,
    title: 'Synthesizing Dynamic Captions',
    description: 'Rendering animated kinetic typography and sound-effect markers...',
    durationMs: 3000,
  },
  {
    step: 6,
    title: 'Finalizing & Compiling MP4s',
    description: 'Polishing exports for TikTok, Instagram Reels, and YouTube Shorts...',
    durationMs: 2000,
  },
];
