'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Video,
  Upload,
  Link2,
  Sparkles,
  Check,
  AlertCircle,
  Sliders,
  Type,
  Maximize2,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CAPTION_STYLES } from '@/lib/constants';
import { CreateClipFormData, AspectRatio, CaptionStyleId, UserProfile } from '@/lib/types';
import { isDemoMode } from '@/lib/mock-service';
import { getMe, toUserProfile, createJob } from '@/lib/api-client';
import { UpgradeModal } from '@/components/pricing/upgrade-modal';

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Form State
  const [sourceType, setSourceType] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<CreateClipFormData['category']>('podcast');
  const [clipCount, setClipCount] = useState(3);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleId>('karaoke');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [autoReframe, setAutoReframe] = useState(true);
  const [sensitivity, setSensitivity] = useState<'balanced' | 'aggressive' | 'conservative'>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => {
        if (active && u) setUser(toUserProfile(u));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Pre-fill the source URL when arriving from the campaign directory
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get('sourceUrl');
    if (!sourceUrl) return;
    const id = window.setTimeout(() => {
      setYoutubeUrl(sourceUrl);
      setSourceType('youtube');
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const isPro = user?.tier === 'pro';
  const maxClipsAllowed = isPro ? 10 : 3;

  const handleQuickUrlSample = (url: string) => {
    setYoutubeUrl(url);
    setError(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sourceType === 'youtube') {
      if (!youtubeUrl.trim()) {
        setError('Please enter a valid YouTube video or podcast URL.');
        return;
      }
      if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
        setError('Please enter a recognized YouTube URL (e.g. https://www.youtube.com/watch?v=...)');
        return;
      }
    } else {
      if (!uploadedFile) {
        setError('Please select or drag an MP4 or MOV video file to upload.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await createJob({
        sourceUrl: youtubeUrl.trim(),
        category,
        clipCount,
        aspectRatio,
        autoReframe,
        highlightSensitivity: sensitivity,
        captionPreset: captionStyle,
      });
      router.push(`/processing?jobId=${encodeURIComponent(result.jobId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
      setSubmitting(false);
    }
  };

  const handleUpgradeClick = () => {
    if (isDemoMode()) {
      setUpgradeOpen(true);
    } else {
      router.push('/pricing');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Title & Intro */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
              Create New Viral Shorts
            </h1>
            <Badge variant="gradient">AI Ingestion</Badge>
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Submit a long-form video. AI will detect golden hooks, reframe to vertical, and style captions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Video Source Input */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <span>Select Source Video</span>
              </label>

              {/* Toggle Source Type */}
              <div className="bg-[#1C1C22] p-1 rounded-xl border border-white/5 flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSourceType('youtube');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    sourceType === 'youtube'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                      : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>YouTube URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('upload');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    sourceType === 'upload'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                      : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            {/* Source Content Area */}
            {sourceType === 'youtube' ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-pink-500 transition font-mono"
                  />
                  <Video className="w-4 h-4 text-pink-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>

                {/* Quick Sample Links for Fast Testing */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[#71717A] text-[11px]">Quick Samples:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickUrlSample(
                        'https://www.youtube.com/watch?v=kPo3TfVfP1A'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#A1A1AA] hover:text-[#F5F5F7] transition"
                  >
                    Huberman Lab #184 (Focus)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickUrlSample(
                        'https://www.youtube.com/watch?v=Ff4fRgnuFgQ'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#A1A1AA] hover:text-[#F5F5F7] transition"
                  >
                    Lex & Zuck #418 (Meta AI)
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-white/15 hover:border-pink-500/50 rounded-2xl p-8 text-center bg-[#0A0A0C]/50 transition cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/mp4,video/quicktime,video/webm';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) setUploadedFile(files[0]);
                  };
                  input.click();
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#F5F5F7]">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-[#71717A]">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#F5F5F7]">
                      Drag and drop MP4 or MOV here
                    </p>
                    <p className="text-xs text-[#71717A]">
                      Supports up to 2GB videos • Click to browse files
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Free Tier Limitation notice */}
            {!isPro && (
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-start gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Free Tier Limits:</span> Max 10 minutes source video & 3 clips.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUpgradeClick}
                  className="text-pink-400 hover:text-pink-300 font-bold shrink-0 underline"
                >
                  Upgrade to Pro (120m)
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Content Category & Presets */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4">
            <label className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-mono">
                2
              </span>
              <span>Content Category Preset</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'podcast', label: 'Podcast & Talk' },
                { id: 'interview', label: '1-on-1 Interview' },
                { id: 'education', label: 'Lecture & Tech' },
                { id: 'gaming', label: 'Gaming Streams' },
                { id: 'music', label: 'Music & Creative' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as CreateClipFormData['category'])}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                    category === cat.id
                      ? 'bg-[#1C1C22] border-pink-500 text-pink-300 shadow-sm'
                      : 'bg-[#0A0A0C] border-white/5 text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Styling & Generation Parameters */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-6">
            <label className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-mono">
                3
              </span>
              <span>Formatting & Caption Engine</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2 flex items-center justify-between">
                  <span>Aspect Ratio</span>
                  <span className="text-[11px] text-pink-400">Optimized for TikTok / Reels</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '9:16', label: '9:16 Portrait', desc: 'Shorts & Reels' },
                    { id: '1:1', label: '1:1 Square', desc: 'LinkedIn / Feed' },
                    { id: '16:9', label: '16:9 Landscape', desc: 'YouTube Standard' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id as AspectRatio)}
                      className={`p-3 rounded-xl border text-center transition ${
                        aspectRatio === ratio.id
                          ? 'bg-[#1C1C22] border-pink-500 text-[#F5F5F7]'
                          : 'bg-[#0A0A0C] border-white/5 text-[#A1A1AA] hover:text-[#F5F5F7]'
                      }`}
                    >
                      <span className="text-xs font-bold block">{ratio.id}</span>
                      <span className="text-[10px] text-[#71717A] mt-0.5 block">{ratio.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Clips */}
              <div>
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="text-[#A1A1AA] font-medium">Clips to Generate</span>
                  <span className="font-mono text-pink-400 font-bold">
                    {clipCount} clip{clipCount > 1 ? 's' : ''} {isPro ? '(Pro: Up to 10)' : '(Free Limit: 3)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxClipsAllowed}
                  value={clipCount}
                  onChange={(e) => setClipCount(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                {!isPro && clipCount === 3 && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Want 10 clips per video? Upgrade to Pro.
                  </p>
                )}
              </div>
            </div>

            {/* Caption Style Preview Cards */}
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-pink-400" />
                <span>Select Animated Caption Aesthetic</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CAPTION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setCaptionStyle(style.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-3 ${
                      captionStyle === style.id
                        ? 'bg-[#1C1C22] border-pink-500 shadow-lg shadow-pink-500/10'
                        : 'bg-[#0A0A0C] border-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[#F5F5F7]">
                          {style.name}
                        </span>
                        <Badge variant="outline" size="sm" className="text-[9px] py-0">
                          {style.badge}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[#71717A] leading-relaxed">
                        {style.description}
                      </p>
                    </div>

                    {/* Miniature live typography simulation */}
                    <div className="p-2 rounded-lg bg-black border border-white/10 text-center">
                      <span className={`text-[11px] ${style.previewColor}`}>
                        VIRAL HOOK WORD
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Reframe & AI Hook sensitivity toggles */}
            <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-white/5">
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F7] block">
                    AI Active Speaker Face-Tracking
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Dynamically frames speakers in 9:16 vertical
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoReframe}
                  onChange={(e) => setAutoReframe(e.target.checked)}
                  className="w-4 h-4 accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-white/5">
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F7] block">
                    Hook Sensitivity
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Score density of emotional peaks
                  </span>
                </div>
                <select
                  value={sensitivity}
                  onChange={(e) =>
                    setSensitivity(
                      e.target.value as 'balanced' | 'aggressive' | 'conservative'
                    )
                  }
                  className="bg-[#1C1C22] border border-white/10 rounded-lg text-xs text-[#F5F5F7] px-2 py-1 focus:outline-none"
                >
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive (High Energy)</option>
                  <option value="conservative">Conservative (Strict)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error notice if any */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[#71717A] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Consumes <strong className="text-[#F5F5F7]">1 Credit</strong> • Instant AI Queue
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full sm:w-auto px-8 shadow-xl shadow-pink-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start AI Clipping Process</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {isDemoMode() && (
        <UpgradeModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          currentUser={user}
          onUserUpdated={(u) => setUser(u)}
        />
      )}
    </AppShell>
  );
}
