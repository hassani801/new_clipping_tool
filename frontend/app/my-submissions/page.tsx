'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  ExternalLink,
  Trash2,
  Video,
  Link2,
  CalendarClock,
  StickyNote,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getMySubmissions,
  deleteSubmission,
  CampaignSubmissionLog,
} from '@/lib/campaign-api';
import { getJob } from '@/lib/api-client';

function ClipThumb({ clipJobId }: { clipJobId: string }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJob(clipJobId)
      .then((job) => {
        if (active && job?.clipsData?.[0]?.thumbnailUrl) {
          setThumb(job.clipsData[0].thumbnailUrl);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [clipJobId]);

  return (
    <Link
      href={`/results/${clipJobId}`}
      className="w-14 h-9 rounded-lg overflow-hidden ring-1 ring-white/10 bg-[#0A0A0C] flex items-center justify-center shrink-0 hover:ring-pink-500/50 transition"
      title="View the clip"
    >
      {thumb ? (
        <img src={thumb} alt="Clip" className="w-full h-full object-cover" />
      ) : (
        <Video className="w-4 h-4 text-[#71717A]" />
      )}
    </Link>
  );
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<CampaignSubmissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMySubmissions()
      .then((data) => {
        if (!active) return;
        setSubmissions(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this submission log entry?')) return;
    setDeletingId(id);
    try {
      await deleteSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const platformLabel = (s: CampaignSubmissionLog) =>
    s.campaignListing?.platformName ||
    s.freeTextPlatformName ||
    'Unknown platform';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
              My Submissions
            </h1>
            <Badge variant="outline">Self-reported</Badge>
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Your self-reported submission history — this is for your own
            tracking only. We don&apos;t have access to real view counts, approval
            status, or payments from these external platforms.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={ClipboardList}
            title="Sign in to view submissions"
            description={`We couldn't load your submission history (${error}). This section requires an authenticated account.`}
            actionLabel="Browse Campaigns"
            onAction={() => router.push('/campaigns')}
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No submissions logged yet"
            description="When you submit a published clip to a campaign, it will show up here so you can track your own progress."
            actionLabel="Find Campaigns"
            onAction={() => router.push('/campaigns')}
          />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[#141418] border border-white/[0.08] flex items-start gap-3"
              >
                {s.clipJobId && <ClipThumb clipJobId={s.clipJobId} />}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="gradient" size="sm">
                      {platformLabel(s)}
                    </Badge>
                    <span className="text-[11px] text-[#71717A] flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {new Date(s.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  <a
                    href={s.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-mono max-w-full transition"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.postUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  {s.notes && (
                    <p className="text-[11px] text-[#A1A1AA] flex items-start gap-1.5">
                      <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{s.notes}</span>
                    </p>
                  )}
                </div>

                <Button
                  variant="danger"
                  size="icon"
                  loading={deletingId === s.id}
                  onClick={() => handleDelete(s.id)}
                  aria-label="Delete submission"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
