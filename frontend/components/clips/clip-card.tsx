'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GeneratedClip } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Edit3,
  Share2,
  Download,
  Flame,
  CheckCircle2,
  TrendingUp,
  Eye,
  Trash2,
} from 'lucide-react';

interface ClipCardProps {
  clip: GeneratedClip;
  onEdit: (clip: GeneratedClip) => void;
  onPublish: (clip: GeneratedClip) => void;
  onDelete?: (clipId: string) => void;
}

export function ClipCard({ clip, onEdit, onPublish, onDelete }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-pink-400 border-pink-500/40 bg-pink-500/10';
    if (score >= 90) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  };

  const handleDownload = () => {
    setDownloaded(true);
    // Simulate instant download feedback
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group rounded-2xl bg-[#141418] border border-white/[0.08] hover:border-pink-500/30 overflow-hidden flex flex-col transition-all duration-300 shadow-lg shadow-black/40"
    >
      {/* 9:16 Thumbnail Container with Preview Simulation */}
      <div className="relative w-full aspect-[9/14] bg-black overflow-hidden select-none">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isPlaying ? 'scale-105' : 'group-hover:scale-102'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-black/60 pointer-events-none" />

        {/* Top Badges: Virality & Aspect Ratio */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md ${getScoreColor(
              clip.viralScore
            )}`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{clip.viralScore} Viral Score</span>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/70 text-white/90 border border-white/10 backdrop-blur-md">
            {clip.aspectRatio}
          </span>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95 group-hover:scale-110 shadow-xl"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            )}
          </button>
        </div>

        {/* Bottom Preview: Animated Caption Teaser & Views Estimate */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          <div className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-center shadow-lg">
            <p className="text-xs font-black tracking-wide uppercase text-yellow-300 line-clamp-2 drop-shadow">
              {clip.hookSentence}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-[#A1A1AA] px-1 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Est. {clip.viewsEstimate || '350K+'}
            </span>
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-white/80">
              {clip.durationSeconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F5F7] group-hover:text-pink-300 transition-colors line-clamp-1">
            {clip.title}
          </h3>
          <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed">
            {clip.summary}
          </p>
        </div>

        {/* Tags and Published Channels */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {clip.publishedPlatforms.length > 0 ? (
            clip.publishedPlatforms.map((p) => (
              <Badge key={p} variant="success" size="sm">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{p.toUpperCase()}</span>
              </Badge>
            ))
          ) : (
            <span className="text-[11px] text-[#71717A] italic">
              Ready to publish
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.07]">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(clip)}
            className="text-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onPublish(clip)}
            className="text-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Publish</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloaded ? 'Saved!' : 'MP4'}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
