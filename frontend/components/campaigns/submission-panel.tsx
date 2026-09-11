'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ExternalLink,
  Send,
  Info,
  ClipboardCopy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getActiveCampaignListings,
  createSubmission,
  CampaignListing,
} from '@/lib/campaign-api';

interface SubmissionPanelProps {
  clipJobId: string;
}

export function SubmissionPanel({ clipJobId }: SubmissionPanelProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [listings, setListings] = useState<CampaignListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [otherPlatform, setOtherPlatform] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);

  useEffect(() => {
    let active = true;
    getActiveCampaignListings()
      .then((data) => {
        if (active) setListings(data);
      })
      .catch(() => {
        if (active) setListings([]);
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
    return Array.from(seen);
  }, [listings]);

  const selectedListing = useMemo(() => {
    if (!selectedPlatform || selectedPlatform === '__other') return null;
    return (
      listings.find((l) => l.platformName === selectedPlatform) || null
    );
  }, [selectedPlatform, listings]);

  const isOther = selectedPlatform === '__other';
  const displayPlatform = isOther
    ? otherPlatform.trim() || 'Platform'
    : selectedPlatform || 'Platform';

  const submissionUrl = selectedListing
    ? selectedListing.externalSubmissionUrl || selectedListing.externalJoinUrl
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatform) {
      toast('Please select a platform first.', 'error');
      return;
    }
    if (isOther && !otherPlatform.trim()) {
      toast('Please type the platform name.', 'error');
      return;
    }
    if (!postUrl.trim()) {
      toast('Please paste the URL of your published post first.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission({
        campaignListingId: selectedListing?.id,
        freeTextPlatformName: isOther ? otherPlatform.trim() : undefined,
        postUrl: postUrl.trim(),
        clipJobId,
        notes: notes.trim() || undefined,
      });

      try {
        await navigator.clipboard.writeText(postUrl.trim());
        toast(
          `Link copied to clipboard! Opening ${displayPlatform}...`,
          'success',
        );
      } catch {
        toast(
          `Submission logged. Opening ${displayPlatform}... (auto-copy unavailable — please copy your link manually).`,
          'info',
        );
      }

      setShowPasteHint(true);

      setTimeout(() => {
        if (submissionUrl) {
          window.open(submissionUrl, '_blank', 'noopener,noreferrer');
        }
      }, 800);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to log submission.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600/20 to-pink-500/20 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F7]">
              Submitting to a campaign?
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Log your post and get taken straight to the platform
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[#A1A1AA] transition-transform',
            open && 'rotate-180 text-pink-400',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4"
            >
              <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  We&apos;ll copy your link and take you to the platform — you&apos;ll
                  need to complete the submission there yourself.
                </span>
              </div>

              {/* Platform dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Select platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl text-xs text-[#F5F5F7] px-3 py-2.5 focus:outline-none focus:border-pink-500 transition"
                >
                  <option value="">Choose a platform…</option>
                  {loading && <option disabled>Loading campaigns…</option>}
                  {!loading &&
                    platformNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  <option value="__other">Other (type manually)</option>
                </select>

                {isOther && (
                  <input
                    type="text"
                    value={otherPlatform}
                    onChange={(e) => setOtherPlatform(e.target.value)}
                    placeholder="Type platform name (e.g. My Creator Network)"
                    className="mt-2 w-full bg-[#0A0A0C] border border-white/10 rounded-xl text-xs text-[#F5F5F7] placeholder-[#71717A] px-3 py-2.5 focus:outline-none focus:border-pink-500 transition"
                  />
                )}
              </div>

              {/* Post URL */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Paste your published post URL
                </label>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@you/video/123…"
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl text-xs text-[#F5F5F7] placeholder-[#71717A] px-3 py-2.5 focus:outline-none focus:border-pink-500 transition font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you want to remember about this submission…"
                  rows={2}
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl text-xs text-[#F5F5F7] placeholder-[#71717A] px-3 py-2.5 focus:outline-none focus:border-pink-500 transition resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitting}
                className="w-full"
              >
                <ClipboardCopy className="w-4 h-4" />
                <span>Submit to {displayPlatform}</span>
              </Button>

              {showPasteHint && (
                <p className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
                  <ExternalLink className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>
                    Paste (Ctrl+V or Cmd+V) into the submission form on the page
                    that just opened.
                  </span>
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
