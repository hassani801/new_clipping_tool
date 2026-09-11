'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Scissors,
  TrendingUp,
  FileText,
  ListChecks,
  Building2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getCampaignListing, CampaignListing } from '@/lib/campaign-api';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: DetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;

  const [listing, setListing] = useState<CampaignListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCampaignListing(listingId)
      .then((data) => {
        if (active) setListing(data);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Listing not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listingId]);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>

        {loading ? (
          <div className="h-64 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
        ) : !listing ? (
          <EmptyState
            icon={Building2}
            title="Listing not found"
            description={error || 'This campaign listing is no longer available.'}
            actionLabel="Browse Campaigns"
            onAction={() => router.push('/campaigns')}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-[#141418] border border-white/[0.08] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {listing.platformLogoUrl ? (
                  <img
                    src={listing.platformLogoUrl}
                    alt={listing.platformName}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10 bg-[#0A0A0C]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600/30 to-pink-500/30 border border-white/10 text-pink-300 flex items-center justify-center text-lg font-black uppercase">
                    {listing.platformName.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-semibold text-[#A1A1AA]">
                    {listing.platformName}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
                    {listing.campaignTitle}
                  </h1>
                </div>
              </div>
              <Badge variant="success" size="md">
                <TrendingUp className="w-3.5 h-3.5" />
                {listing.ratePerThousandViews}
              </Badge>
            </div>

            <div className="space-y-2">
              <h2 className="text-xs font-bold text-[#F5F5F7] flex items-center gap-2 uppercase tracking-wide">
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                About this campaign
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {listing.requirements && (
              <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-white/[0.06] space-y-2">
                <h2 className="text-xs font-bold text-[#F5F5F7] flex items-center gap-2 uppercase tracking-wide">
                  <ListChecks className="w-3.5 h-3.5 text-pink-400" />
                  Requirements
                </h2>
                <p className="text-xs text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                  {listing.requirements}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/[0.06]">
              {listing.sourceVideoUrl && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() =>
                    router.push(
                      `/create?sourceUrl=${encodeURIComponent(listing.sourceVideoUrl as string)}`,
                    )
                  }
                >
                  <Scissors className="w-4 h-4" />
                  <span>Clip This Video</span>
                </Button>
              )}
              <a
                href={listing.externalJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="primary" size="lg" className="w-full">
                  <ExternalLink className="w-4 h-4" />
                  <span>Join on {listing.platformName}</span>
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
