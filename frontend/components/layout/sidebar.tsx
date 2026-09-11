'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  BarChart3,
  Settings,
  Sparkles,
  Zap,
  HelpCircle,
  ChevronRight,
  Video,
  Megaphone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TierType } from '@/lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
  badge?: string;
  nested?: boolean;
}

interface SidebarProps {
  userTier: TierType;
  creditsUsed?: number;
  creditsMax?: number;
  isAdmin?: boolean;
  onUpgradeClick: () => void;
  onCloseMobile?: () => void;
}

export function Sidebar({
  userTier,
  creditsUsed,
  creditsMax,
  isAdmin = false,
  onUpgradeClick,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Create New Clip',
      href: '/create',
      icon: PlusCircle,
      highlight: true,
    },
    {
      label: 'My Projects',
      href: '/projects',
      icon: FolderKanban,
    },
    {
      label: 'Campaigns',
      href: '/campaigns',
      icon: Megaphone,
    },
    {
      label: 'My Submissions',
      href: '/my-submissions',
      icon: Send,
      nested: true,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      badge: 'Beta',
    },
    {
      label: 'Pricing & Plans',
      href: '/pricing',
      icon: Sparkles,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin: Campaigns',
            href: '/admin/campaign-listings',
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 h-full bg-[#0D0D10] border-r border-white/[0.08] flex flex-col justify-between p-4 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-3 py-2 mb-6">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-[#F5F5F7] tracking-tight flex items-center gap-1.5">
                Cliptor
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  AI
                </span>
              </span>
              <p className="text-[10px] text-[#71717A]">Video to Viral Shorts</p>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center justify-between rounded-xl font-medium transition-all group relative',
                  item.nested
                    ? 'pl-10 pr-3.5 py-2 text-[13px]'
                    : 'px-3.5 py-2.5 text-sm',
                  isActive
                    ? 'bg-[#1C1C22] text-[#F5F5F7] border border-white/10 shadow-sm'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive
                        ? 'text-pink-400'
                        : 'text-[#71717A] group-hover:text-[#A1A1AA]'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1.5">
                    {item.badge}
                  </Badge>
                )}

                {item.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Tier & Credits status */}
      <div className="space-y-3 pt-4 border-t border-white/[0.08]">
        {/* Tier status card */}
        <div className="p-3.5 rounded-2xl bg-[#141418] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {userTier === 'pro' ? 'Pro Creator' : 'Free Plan'}
            </span>
            <Badge variant={userTier === 'pro' ? 'pro' : 'default'}>
              {userTier === 'pro' ? 'Active' : 'Limited'}
            </Badge>
          </div>

          <div className="space-y-1.5">
            {typeof creditsUsed === 'number' && typeof creditsMax === 'number' ? (
              <>
                <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                  <span>Monthly Credits</span>
                  <span className="font-mono text-[#F5F5F7]">
                    {creditsUsed} / {creditsMax}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#24242C] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      userTier === 'pro'
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500'
                        : 'bg-indigo-500'
                    )}
                    style={{
                      width: `${Math.min(100, (creditsUsed / creditsMax) * 100)}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-[#A1A1AA]">
                {userTier === 'pro' ? 'Pro' : 'Free'} plan active
              </p>
            )}
          </div>

          {userTier === 'free' && (
            <button
              onClick={onUpgradeClick}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white transition flex items-center justify-center gap-1 shadow-md shadow-pink-500/20"
            >
              <span>Upgrade to Pro</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Support link */}
        <div className="flex items-center justify-between px-2 text-[11px] text-[#71717A]">
          <Link
            href="/#faq"
            className="flex items-center gap-1.5 hover:text-[#A1A1AA] transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Documentation & FAQ</span>
          </Link>
          <span className="font-mono text-[10px]">v1.4.0</span>
        </div>
      </div>
    </aside>
  );
}
