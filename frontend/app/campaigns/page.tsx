'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Megaphone,
  ExternalLink,
  Scissors,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  getActiveCampaignListings,
  CampaignListing,
} from '@/lib/campaign-api';

function PlatformBadge({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className="w-6 h-6 rounded-md object-cover ring-1 ring-white/10 bg-[#0A0A0C]"
        />
      ) : (
        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600/30 to-pink-500/30 border border-white/10 text-pink-300 flex items-center justify-center text-[10px] font-black uppercase">
          {name.charAt(0)}
        </div>
      )}
      <span className="text-[11px] font-semibold text-[#A1A1AA]">{name}</span>
    </div>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<CampaignListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    getActiveCampaignListings()
      .then((data) => {
        if (active) setListings(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const platformNames = useMemo(() => {
    const seen = new Set<string>();
    listings.forEach((l) => seen.add(l.platformName));
    return Array.from(seen).sort();
  }, [listings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return listings;
    return listings.filter((l) => l.platformName === filter);
  }, [listings, filter]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
              Find Paying Clip Campaigns
            </h1>
            <Badge variant="gradient">Earn</Badge>
          </div>
          <p className="text-xs text-[#A1A1AA] max-w-2xl leading-relaxed">
            Discover campaigns from platforms like Vyro and Whop, clip the
            source content with our tool, then submit your posts to get paid.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Couldn&apos;t reach the campaign directory server ({error}). Showing
              an empty state — check your backend connection.
            </span>
          </div>
        )}

        {/* Filter pills */}
        {platformNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium border transition',
                filter === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-transparent'
                  : 'bg-[#141418] text-[#A1A1AA] border-white/10 hover:text-[#F5F5F7]',
              )}
            >
              All Platforms
            </button>
            {platformNames.map((name) => (
              <button
                key={name}
                onClick={() => setFilter(name)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium border transition',
                  filter === name
                    ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-transparent'
                    : 'bg-[#141418] text-[#A1A1AA] border-white/10 hover:text-[#F5F5F7]',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns listed yet"
            description="There are no active clip-for-pay campaigns right now. Check back soon — new listings are added manually by our team."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => {
              const isExpanded = expanded.has(listing.id);
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => router.push(`/campaigns/${listing.id}`)}
                  className="rounded-2xl bg-[#141418] border border-white/[0.08] p-5 flex flex-col gap-4 cursor-pointer hover:border-white/20 hover:shadow-xl hover:shadow-black/50 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <PlatformBadge
                      name={listing.platformName}
                      logoUrl={listing.platformLogoUrl}
                    />
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{listing.ratePerThousandViews}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#F5F5F7] leading-snug">
                      {listing.campaignTitle}
                    </h3>
                    <p
                      className={cn(
                        'text-xs text-[#A1A1AA] leading-relaxed',
                        !isExpanded && 'line-clamp-3',
                      )}
                    >
                      {listing.description}
                    </p>
                    {listing.description.length > 160 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(listing.id);
                        }}
                        className="text-[11px] text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    {listing.sourceVideoUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/create?sourceUrl=${encodeURIComponent(listing.sourceVideoUrl as string)}`,
                          );
                        }}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Clip This Video</span>
                      </Button>
                    )}
                    <a
                      href={listing.externalJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join on {listing.platformName}</span>
                      </Button>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
