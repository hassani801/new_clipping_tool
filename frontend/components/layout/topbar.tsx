'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Sparkles,
  Server,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';
import { logout } from '@/lib/api-client';


interface TopBarProps {
  user: UserProfile | null;
  onOpenMobileMenu: () => void;
  onUpgradeClick: () => void;
  isProcessingActive?: boolean;
}

export function TopBar({
  user,
  onOpenMobileMenu,
  onUpgradeClick,
  isProcessingActive = false,
}: TopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch {
      // ignore — cookie is cleared server-side; redirect regardless
    }
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0A0A0C]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & breadcrumb or title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Queue / System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] border border-white/[0.07] text-xs">
          <Server className="w-3.5 h-3.5 text-[#71717A]" />
          <span className="text-[#A1A1AA]">AI Processing Queue:</span>
          {isProcessingActive ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Rendering active clip...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Instant (<span className="text-[#F5F5F7]">0 wait</span>)
            </span>
          )}
        </div>
      </div>

      {/* Right Actions: Upgrade CTA, Queue/Notifications, Profile */}
      <div className="flex items-center gap-3">
        {user?.tier === 'free' && (
          <Button
            variant="primary"
            size="sm"
            onClick={onUpgradeClick}
            className="hidden sm:inline-flex"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get Pro (1,000 PKR)</span>
          </Button>
        )}

        {/* Tier badge */}
        <Badge variant={user?.tier === 'pro' ? 'pro' : 'default'} size="md">
          {user?.tier === 'pro' ? 'PRO PLAN' : 'FREE TIER'}
        </Badge>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10"
          >
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'User'}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20"
            />
            <span className="text-xs font-medium text-[#F5F5F7] hidden md:inline-block">
              {user?.name || 'Creator'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141418] border border-white/10 shadow-2xl shadow-black p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-[#F5F5F7] truncate">
                    {user?.name || 'Alex Vance'}
                  </p>
                  <p className="text-[11px] text-[#71717A] truncate">
                    {user?.email || 'alex@creator.io'}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5 rounded-lg transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile & Account</span>
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onUpgradeClick();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-pink-300 hover:bg-pink-500/10 rounded-lg transition text-left"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Manage Tier</span>
                  </span>
                  <Badge variant="gradient" size="sm">
                    {user?.tier?.toUpperCase()}
                  </Badge>
                </button>

                <div className="pt-1 border-t border-white/5">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
