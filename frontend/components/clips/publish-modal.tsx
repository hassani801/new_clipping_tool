'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedClip } from '@/lib/types';
import { Check, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublishModalProps {
  clip: GeneratedClip | null;
  isOpen: boolean;
  onClose: () => void;
  onClipUpdated: (updated: GeneratedClip) => void;
}

function PublishModalInner({
  clip,
  onClose,
  onClipUpdated,
}: {
  clip: GeneratedClip;
  onClose: () => void;
  onClipUpdated: (updated: GeneratedClip) => void;
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<('tiktok' | 'instagram' | 'youtube')[]>([
    'tiktok',
  ]);
  const [caption, setCaption] = useState(
    `${clip.hookSentence} 🚀\n\n#${clip.tags.slice(0, 3).join(' #')} #shorts #reels #viral #podcast`
  );
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);

  const togglePlatform = (p: 'tiktok' | 'instagram' | 'youtube') => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handlePublish = async () => {
    setPosting(true);
    try {
      const existing = clip.publishedPlatforms || [];
      const updatedPlatforms = Array.from(
        new Set([...existing, ...selectedPlatforms]),
      );
      const updatedClip: GeneratedClip = {
        ...clip,
        publishedPlatforms: updatedPlatforms,
      };
      onClipUpdated(updatedClip);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Coming Soon notice */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
        <span className="text-base">🚧</span>
        <div>
          <span className="font-semibold">Direct Social Publishing: Coming Soon</span>
          <p className="text-[11px] text-amber-400/80 mt-0.5">
            Direct publishing to TikTok, Instagram Reels, and YouTube Shorts will be available in an upcoming update. Use download in the meantime!
          </p>
        </div>
      </div>

      {/* Clip preview row */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C22] border border-white/5">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="w-12 h-16 object-cover rounded-lg ring-1 ring-white/10 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-[#F5F5F7] truncate">
            {clip.title}
          </h4>
          <p className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">
            {clip.hookSentence}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="gradient" size="sm">
              Viral Score: {clip.viralScore}/100
            </Badge>
            <span className="text-[10px] text-[#71717A] font-mono">
              {clip.durationSeconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div>
        <label className="block text-xs font-medium text-[#A1A1AA] mb-2">
          Select Destination Channels
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'tiktok', name: 'TikTok', color: 'from-cyan-500 to-pink-500' },
            { id: 'instagram', name: 'IG Reels', color: 'from-amber-500 to-pink-600' },
            { id: 'youtube', name: 'YT Shorts', color: 'from-red-500 to-rose-600' },
          ].map((p) => {
            const active = selectedPlatforms.includes(
              p.id as 'tiktok' | 'instagram' | 'youtube'
            );
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  togglePlatform(p.id as 'tiktok' | 'instagram' | 'youtube')
                }
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-[#1C1C22] border-pink-500/50 shadow-md shadow-pink-500/10'
                    : 'bg-[#141418] border-white/5 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.color}`}
                />
                <span className="text-xs font-semibold text-[#F5F5F7]">
                  {p.name}
                </span>
                {active && (
                  <Badge variant="success" size="sm" className="text-[9px] py-0 px-1">
                    Ready
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Caption & Hashtags */}
      <div>
        <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5 flex items-center justify-between">
          <span>Caption & Optimized Hashtags</span>
          <span className="text-[10px] text-pink-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Hook Generator
          </span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition resize-none leading-relaxed"
        />
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={posting}
          onClick={handlePublish}
          disabled={selectedPlatforms.length === 0}
        >
          {success ? (
            <span className="flex items-center gap-1.5 text-white">
              <Check className="w-4 h-4" />
              Published!
            </span>
          ) : (
            `Publish to ${selectedPlatforms.length} Channel${selectedPlatforms.length > 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  );
}

export function PublishModal({
  clip,
  isOpen,
  onClose,
  onClipUpdated,
}: PublishModalProps) {
  if (!clip) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5F7]">
              1-Click Publish to Socials
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Auto-format and schedule to your connected social channels
            </p>
          </div>
        </div>
      }
    >
      <PublishModalInner
        key={clip.id}
        clip={clip}
        onClose={onClose}
        onClipUpdated={onClipUpdated}
      />
    </Modal>
  );
}
