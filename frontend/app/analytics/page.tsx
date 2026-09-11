'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Eye,
  Share2,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                AI Virality & Performance Analytics
              </h1>
              <Badge variant="gradient">Private Beta</Badge>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Track cross-platform view velocity, audience retention curves, and top-performing hook styles
            </p>
          </div>

          <Badge variant="pro" size="md">
            COMING SOON
          </Badge>
        </div>

        {/* Coming Soon Teaser Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1C1C22] to-[#141418] border border-pink-500/30 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Early Access Feature
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
              Connect TikTok & Reels Analytics Directly to Your Video Clips
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              We are finalizing live OAuth webhook sync with TikTok Creator API and Meta Graph API to correlate our AI hook scores with real-world viral viewership.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => alert('You have been added to the Priority Analytics Beta list!')}
            className="shadow-lg shadow-pink-500/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Join Beta Waitlist</span>
          </Button>
        </div>

        {/* Simulated Teaser Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-80 pointer-events-none select-none">
          {/* Platform Distribution */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>Platform Reach Split</span>
            </h3>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#A1A1AA]">TikTok</span>
                  <span className="font-mono text-[#F5F5F7]">54% • 1.8M views</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-400 w-[54%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#A1A1AA]">Instagram Reels</span>
                  <span className="font-mono text-[#F5F5F7]">32% • 1.1M views</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-500 w-[32%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#A1A1AA]">YouTube Shorts</span>
                  <span className="font-mono text-[#F5F5F7]">14% • 480K views</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-red-500 w-[14%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Retention Curve Preview */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Average 3-Second Hook Retention (Kinetic Captions vs Standard)</span>
            </h3>

            <div className="h-32 flex items-end gap-2 pt-4 border-b border-white/10">
              {[45, 52, 68, 79, 88, 94, 91, 87, 84, 82, 80, 78, 75, 73, 70].map(
                (val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-pink-500 opacity-80"
                    style={{ height: `${val}%` }}
                  />
                )
              )}
            </div>
            <div className="flex justify-between text-[10px] text-[#71717A] font-mono">
              <span>0s Hook Start</span>
              <span>15s Midpoint</span>
              <span>45s Completion (70% Retained)</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
