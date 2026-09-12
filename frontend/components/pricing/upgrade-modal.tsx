'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRO_PRICE_PKR, PRO_PRICE_ANNUAL_PKR } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const isPro = currentUser?.tier === 'pro';

  const proFeatures = [
    'Up to 120-minute video duration (vs 10 mins)',
    'Generate up to 10 clips per long video',
    '50 video conversions per month',
    'No watermark on exports',
    '1080p & 4K ultra HD resolution',
    'Priority AI processing queue (3x faster)',
    'Multi-language transcription & auto-captions',
    'Auto-face reframe (9:16, 1:1, 16:9)',
    '1-click direct publishing to TikTok & Reels',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F5F5F7]">
              {isPro ? 'Manage Pro Subscription' : 'Upgrade to Pro Creator'}
            </h3>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Billing cycle switch */}
        <div className="flex items-center justify-center">
          <div className="bg-[#1C1C22] p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              <span>Annual Billing</span>
              <Badge variant="success" size="sm">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Highlight Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1C22] to-[#141418] border border-pink-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Sparkles className="w-32 h-32 text-pink-500" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                Pro Creator Plan
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight">
                  {billingPeriod === 'monthly'
                    ? formatPKR(PRO_PRICE_PKR)
                    : formatPKR(Math.round(PRO_PRICE_ANNUAL_PKR / 12))}
                </span>
                <span className="text-xs text-[#A1A1AA]">
                  / month {billingPeriod === 'annual' ? '(billed annually)' : ''}
                </span>
              </div>
            </div>

            <Badge variant="pro" size="md">
              Most Popular
            </Badge>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
            Everything you need to turn podcasts, interviews, and long videos into hundreds of viral short clips every month.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-white/10">
            {proFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#F5F5F7]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Guarantee Note */}
        <div className="flex items-center gap-2 text-xs text-[#71717A] justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>7-day full money back guarantee • Cancel anytime with 1 click</span>
        </div>

        {/* Billing not available notice */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <span className="text-base">🚧</span>
          <span>
            <strong>Billing Coming Soon:</strong> Online payments aren&apos;t wired up yet, so plan changes are disabled for now.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled
            className="px-6"
          >
            {isPro
              ? 'Pro Plan Active'
              : `Subscribe (${formatPKR(PRO_PRICE_PKR)}/mo) — Coming Soon`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
