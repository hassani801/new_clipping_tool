'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedClip, CaptionStyleId } from '@/lib/types';
import { CAPTION_STYLES } from '@/lib/constants';
import {
  Scissors,
  Type,
  Play,
  Pause,
  Check,
  Sliders,
} from 'lucide-react';

interface ClipEditorModalProps {
  clip: GeneratedClip | null;
  isOpen: boolean;
  onClose: () => void;
  onClipUpdated: (updated: GeneratedClip) => void;
}

function ClipEditorModalInner({
  clip,
  onClose,
  onClipUpdated,
}: {
  clip: GeneratedClip;
  onClose: () => void;
  onClipUpdated: (updated: GeneratedClip) => void;
}) {
  const [title, setTitle] = useState(clip.title);
  const [transcript, setTranscript] = useState(clip.transcriptExcerpt);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleId>(clip.captionStyle);
  const [startSec, setStartSec] = useState(clip.startTime);
  const [endSec, setEndSec] = useState(clip.endTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: GeneratedClip = {
        ...clip,
        title: title.trim() || clip.title,
        transcriptExcerpt: transcript.trim() || clip.transcriptExcerpt,
        captionStyle,
        startTime: startSec,
        endTime: endSec,
        durationSeconds: Math.max(5, endSec - startSec),
      };
      onClipUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Coming Soon notice */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
        <span className="text-base">🚧</span>
        <span>
          <strong>Coming Soon:</strong> Clip editing &amp; re-rendering is in development. Your clip metadata changes will be saved locally but won&apos;t re-render the video yet.
        </span>
      </div>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

      {/* Left: 9:16 Vertical Video Preview Simulation */}
      <div className="md:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[230px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative flex flex-col justify-between p-3 select-none">
          {/* Background Thumbnail Image */}
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105 filter brightness-95' : 'filter brightness-90'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

          {/* Top Overlay Badge */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10">
              9:16 VERTICAL
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Score: {clip.viralScore}
            </span>
          </div>

          {/* Center: Play/Pause interactive trigger */}
          <div className="relative z-10 flex justify-center my-auto">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition active:scale-90"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>

          {/* Bottom: Dynamic Captions Simulation */}
          <div className="relative z-10 mb-2">
            <div
              className={`p-2.5 rounded-xl backdrop-blur-md text-center transition-all ${
                captionStyle === 'karaoke'
                  ? 'bg-black/70 border border-emerald-500/40 text-emerald-400 font-bold text-xs'
                  : captionStyle === 'cyberpunk'
                  ? 'bg-purple-950/80 border border-fuchsia-500/40 text-fuchsia-300 font-bold text-xs'
                  : 'bg-black/60 border border-white/20 text-white font-medium text-xs'
              }`}
            >
              {transcript.slice(0, 65)}...
            </div>
            <p className="text-[9px] text-center text-white/60 mt-1 font-mono">
              {endSec - startSec}s duration
            </p>
          </div>
        </div>
      </div>

      {/* Right: Trimming, Captions, and Audio controls */}
      <div className="md:col-span-7 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
            Clip Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
          />
        </div>

        {/* Trimmer Sliders */}
        <div className="p-3.5 rounded-xl bg-[#1C1C22] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F5F5F7] flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-pink-400" />
              Trim Timeline
            </span>
            <span className="font-mono text-pink-400 font-bold">
              {startSec}s — {endSec}s ({endSec - startSec}s total)
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-[#71717A] mb-1">
              <span>Start Point</span>
              <span className="font-mono text-[#A1A1AA]">{startSec}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(10, endSec - 5)}
              value={startSec}
              onChange={(e) => setStartSec(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-[#71717A] mb-1">
              <span>End Point</span>
              <span className="font-mono text-[#A1A1AA]">{endSec}s</span>
            </div>
            <input
              type="range"
              min={startSec + 5}
              max={startSec + 60}
              value={endSec}
              onChange={(e) => setEndSec(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Caption Style Selector */}
        <div>
          <label className="block text-xs font-medium text-[#A1A1AA] mb-2 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-pink-400" />
            <span>Animated Caption Style</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CAPTION_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setCaptionStyle(style.id)}
                className={`p-2.5 rounded-xl border text-left transition text-xs ${
                  captionStyle === style.id
                    ? 'bg-[#1C1C22] border-pink-500 text-[#F5F5F7] shadow-sm'
                    : 'bg-[#0A0A0C] border-white/5 text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px]">{style.name}</span>
                  <Badge variant="outline" size="sm" className="text-[9px] py-0">
                    {style.badge}
                  </Badge>
                </div>
                <p className="text-[10px] text-[#71717A] line-clamp-1">
                  {style.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Transcript excerpt */}
        <div>
          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
            Transcript Text & Words
          </label>
          <textarea
            rows={2}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition resize-none leading-relaxed font-mono"
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
            loading={saving}
            onClick={handleSave}
          >
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-white">
                <Check className="w-4 h-4" />
                Saved Changes
              </span>
            ) : (
              'Save Clip Updates'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


export function ClipEditorModal({
  clip,
  isOpen,
  onClose,
  onClipUpdated,
}: ClipEditorModalProps) {
  if (!clip) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5F7]">
              Clip Studio & Timeline Editor
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Trim timestamps, polish captions, and tune 9:16 framing
            </p>
          </div>
        </div>
      }
    >
      <ClipEditorModalInner
        key={clip.id}
        clip={clip}
        onClose={onClose}
        onClipUpdated={onClipUpdated}
      />
    </Modal>
  );
}
