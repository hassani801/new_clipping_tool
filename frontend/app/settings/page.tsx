'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Zap,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/pricing/upgrade-modal';
import { getMe, toUserProfile, updateProfile } from '@/lib/api-client';
import { UserProfile } from '@/lib/types';
import { PRO_PRICE_PKR } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => {
        if (active && u) {
          setUser(toUserProfile(u));
          setDisplayName(u.name || u.email.split('@')[0] || '');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);


  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateProfile(displayName);
      setUser(toUserProfile(result.user));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="pb-2 border-b border-white/[0.08]">
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
            Account & Studio Settings
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Manage your subscription tier, connected social accounts, and video presets
          </p>
        </div>

        {/* SUBSCRIPTION & TIER MANAGEMENT CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#141418] border border-white/10 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#F5F5F7]">
                    Current Subscription: {user?.tier === 'pro' ? 'Pro Creator' : 'Free Tier'}
                  </h3>
                  <Badge variant={user?.tier === 'pro' ? 'pro' : 'default'}>
                    {user?.tier?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  {user?.tier === 'pro'
                    ? `Active at ${formatPKR(PRO_PRICE_PKR)} / month • Priority rendering queue enabled`
                    : 'Limited to 10-minute source videos and 3 clips per job'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={user?.tier === 'pro' ? 'secondary' : 'primary'}
                size="md"
                onClick={() => setUpgradeOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
                <span>{user?.tier === 'pro' ? 'Manage Plan' : `Upgrade to Pro (${formatPKR(PRO_PRICE_PKR)})`}</span>
              </Button>
            </div>
          </div>

          {/* Quota breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#0A0A0C] border border-white/5 text-xs">
            <div>
              <span className="text-[#71717A] block mb-1">Monthly Video Conversions</span>
              <span className="font-mono text-sm font-bold text-[#F5F5F7]">
                {user?.creditsUsed} / {user?.creditsMax} Used
              </span>
            </div>
            <div>
              <span className="text-[#71717A] block mb-1">Max Length Allowed</span>
              <span className="font-mono text-sm font-bold text-[#F5F5F7]">
                {user?.tier === 'pro' ? '120 Minutes' : '10 Minutes'}
              </span>
            </div>
            <div>
              <span className="text-[#71717A] block mb-1">Export Resolution</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {user?.tier === 'pro' ? '4K Ultra HD' : '720p HD (Watermarked)'}
              </span>
            </div>
          </div>
        </div>

        {/* CONNECTED SOCIAL ACCOUNTS */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>Connected Social Distribution Accounts</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Enable 1-click publishing directly from the results view
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <span className="text-base">🚧</span>
            <span>
              <strong>Coming Soon:</strong> Social account connections aren&apos;t available yet. Direct publishing is in development.
            </span>
          </div>

          <div className="space-y-3 opacity-60 pointer-events-none">
            {[
              {
                id: 'tiktok',
                name: 'TikTok Creator Account',
                handle: 'Not connected',
              },
              {
                id: 'instagram',
                name: 'Instagram Reels',
                handle: 'Not connected',
              },
              {
                id: 'youtube',
                name: 'YouTube Shorts Channel',
                handle: 'Not connected',
              },
            ].map((account) => (
              <div
                key={account.id}
                className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F7] block">
                    {account.name}
                  </span>
                  <span className="text-[11px] text-[#71717A]">
                    {account.handle}
                  </span>
                </div>

                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* PROFILE INFORMATION */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            <span>Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#71717A] focus:outline-none transition"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-rose-400">{saveError}</p>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={handleSaveProfile}
            >
              {savedSuccess ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Saved Changes
                </span>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
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
