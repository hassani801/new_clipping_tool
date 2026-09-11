'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Video,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/pricing/upgrade-modal';
import { PRO_PRICE_PKR, PRO_PRICE_ANNUAL_PKR } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import { getMe, toUserProfile } from '@/lib/api-client';
import { UserProfile } from '@/lib/types';

export default function PricingPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => { if (active && u) setUser(toUserProfile(u)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const featureMatrix = [
    { name: 'Max Video Duration', free: '10 Minutes', pro: '120 Minutes' },
    { name: 'Max Clips Per Video', free: '3 Clips', pro: '10 Clips' },
    { name: 'Monthly Video Ingestions', free: '2 Videos', pro: '50 Videos' },
    { name: 'Export Resolution', free: '720p HD', pro: '1080p & 4K Ultra' },
    { name: 'Cliptor Watermark', free: 'Included', pro: 'None (Clean)' },
    { name: 'Priority AI Queue (3x Speed)', free: false, pro: true },
    { name: '9:16 Auto-Face Tracking', free: true, pro: true },
    { name: 'Animated Kinetic Captions', free: true, pro: true },
    { name: 'Multi-Language Whisper AI', free: 'English only', pro: '8+ Languages' },
    { name: '1-Click Multi-Platform Publish', free: false, pro: true },
    { name: 'Direct Timeline Trimming', free: true, pro: true },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-10 py-2">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="pro" size="sm">
            Flexible Creator Plans
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            Generate viral short clips at a fraction of the cost of traditional video editors.
          </p>

          {/* Billing Switch */}
          <div className="pt-2 inline-flex items-center gap-2 p-1 rounded-xl bg-[#141418] border border-white/10">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                !annualBilling
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                  : 'text-[#A1A1AA]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                annualBilling
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                  : 'text-[#A1A1AA]'
              }`}
            >
              <span>Annual Billing</span>
              <Badge variant="success" size="sm">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-3xl bg-[#141418] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-[#F5F5F7]">Free Starter</h3>
                <Badge variant="default">Current Default</Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-black text-[#F5F5F7]">Free</span>
                <span className="text-xs text-[#71717A]">/ month</span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-6">
                Try out our hook detector and kinetic captions on short podcasts.
              </p>

              <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-[#F5F5F7]">
                {[
                  '10-minute max video length',
                  'Generate 3 clips per job',
                  '2 video jobs per month',
                  'English captions only',
                  '720p HD resolution',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#71717A] shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              disabled={user?.tier === 'free'}
              onClick={() => setUpgradeOpen(true)}
              className="w-full mt-8"
            >
              {user?.tier === 'free' ? 'Currently Active' : 'Switch to Free'}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1C1C22] to-[#141418] border-2 border-pink-500/60 flex flex-col justify-between shadow-2xl shadow-pink-500/10 relative">
            <div className="absolute -top-3 right-8">
              <Badge variant="pro" size="md">
                HIGHLY RECOMMENDED
              </Badge>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-pink-300">Pro Creator</h3>
                <Badge variant="gradient">Most Popular</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black text-[#F5F5F7]">
                  {annualBilling
                    ? formatPKR(Math.round(PRO_PRICE_ANNUAL_PKR / 12))
                    : formatPKR(PRO_PRICE_PKR)}
                </span>
                <span className="text-xs text-[#A1A1AA]">
                  / month {annualBilling ? '(billed annually)' : ''}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-6">
                Full-power AI clipping engine with priority GPU queue and 4K exports.
              </p>

              <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-[#F5F5F7]">
                {[
                  '120-minute video duration (12x longer)',
                  'Up to 10 viral clips per video',
                  '50 video conversions every month',
                  'No watermarks anywhere',
                  '1080p & 4K ultra HD exports',
                  'Priority processing queue',
                  'Direct publishing to TikTok & Reels',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setUpgradeOpen(true)}
              className="w-full mt-8 shadow-xl shadow-pink-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {user?.tier === 'pro'
                  ? 'Manage Pro Subscription'
                  : `Upgrade to Pro (${formatPKR(PRO_PRICE_PKR)}/mo)`}
              </span>
            </Button>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#141418] border border-white/[0.08] space-y-4">
          <h2 className="text-lg font-bold text-[#F5F5F7]">
            Detailed Plan Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-[#71717A]">
                  <th className="py-3 px-2 font-medium">Feature</th>
                  <th className="py-3 px-4 font-medium">Free Starter</th>
                  <th className="py-3 px-4 font-medium text-pink-400">Pro Creator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {featureMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-2 text-[#F5F5F7] font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA]">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-[#71717A]" />
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="py-3 px-4 text-pink-300 font-semibold">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-[#71717A]" />
                        )
                      ) : (
                        row.pro
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guarantee Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#71717A]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>7-day 100% money back guarantee • Cancel anytime with 1 click</span>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentUser={user}
        onUserUpdated={(u) => setUser(u)}
      />
    </AppShell>
  );
}
