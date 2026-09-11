'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Flame,
  AlertCircle,
  Download,
  PlusCircle,
  Video,
  Clock,
  Timer,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmissionPanel } from '@/components/campaigns/submission-panel';
import { getJob, getJobClips, JobInfo, JobClip } from '@/lib/api-client';

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

function formatClipTime(seconds: number | undefined): string {
  if (typeof seconds !== 'number') return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<JobInfo | null>(null);
  const [clips, setClips] = useState<JobClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJob(jobId)
      .then((j) => {
        if (!active) return;
        setJob(j);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load results');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  // Load clips once the job is finished; poll while the engine is still running.
  useEffect(() => {
    if (!job) return;
    if (job.status === 'queued' || job.status === 'processing') {
      let active = true;
      const interval = setInterval(async () => {
        try {
          const fresh = await getJob(jobId);
          if (active) setJob(fresh);
          if (fresh.status === 'completed' || fresh.status === 'failed') {
            clearInterval(interval);
            const c = await getJobClips(jobId);
            if (active) setClips(c);
          }
        } catch {
          // transient poll error — keep polling
        }
      }, 3000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
    let active = true;
    getJobClips(jobId)
      .then((c) => {
        if (active) setClips(c);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [job, jobId]);

  const isFinished = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <Link href="/create">
            <Button variant="ghost" size="sm" className="text-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Process Another Video</span>
            </Button>
          </Link>
        </div>

        {/* Job Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#141418] border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600/20 to-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isFinished && <Badge variant="gradient">AI Generation Finished</Badge>}
                {isFailed && <Badge variant="warning">Failed</Badge>}
                {!isFinished && !isFailed && (
                  <Badge variant="outline">Processing…</Badge>
                )}
                <span className="text-xs text-[#71717A]">
                  {clips.length} Vertical Clip{clips.length === 1 ? '' : 's'} Generated
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-[#F5F5F7] tracking-tight truncate">
                {job ? 'Generated Video Clips' : 'Results'}
              </h1>
              {job?.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-pink-400 hover:text-pink-300 block truncate mt-1 transition max-w-full"
                >
                  {job.sourceUrl}
                </a>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-56 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load results"
            description={error}
            actionLabel="Back to Dashboard"
            onAction={() => router.push('/dashboard')}
          />
        ) : isFailed ? (
          <EmptyState
            icon={AlertCircle}
            title="This job failed"
            description={job?.error || 'The processing engine reported a failure.'}
            actionLabel="Try Another Video"
            onAction={() => router.push('/create')}
          />
        ) : clips.length === 0 ? (
          <EmptyState
            icon={Video}
            title={isFinished ? 'No clips were produced' : 'Still processing'}
            description={
              isFinished
                ? 'The engine completed but produced no clips for this source.'
                : 'The engine is still working — clips will appear here when ready.'
            }
            actionLabel={isFinished ? 'Process Another Video' : 'Refresh'}
            onAction={() =>
              isFinished ? router.push('/create') : window.location.reload()
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip, idx) => (
              <motion.div
                key={clip.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="rounded-2xl bg-[#141418] border border-white/[0.08] p-4 flex flex-col gap-3"
              >
                {/* Real clip playback — streamed via the backend from the engine output */}
                <div className="rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                  <video
                    controls
                    preload="metadata"
                    src={`/api/clips/${jobId}/${encodeURIComponent(clip.filename)}`}
                    className="w-full aspect-[9/16] object-contain max-h-[380px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Badge variant="pro" size="sm">
                    <Flame className="w-3 h-3 fill-current" />
                    {clip.viralityScore} VIRAL SCORE
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {Math.round(clip.duration)}s
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-[#F5F5F7] leading-snug">
                  {clip.title}
                </h3>

                {clip.hookSummary && (
                  <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
                    {clip.hookSummary}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-[#71717A] font-mono">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {formatClipTime(clip.startTime)} – {formatClipTime(clip.endTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {clip.aspectRatio || '9:16'}
                  </span>
                </div>

                <a
                  href={`/api/clips/${jobId}/${encodeURIComponent(clip.filename)}`}
                  download
                  className="mt-auto"
                >
                  <Button variant="secondary" size="sm" className="w-full">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {isFinished && (
          <div className="pt-2">
            <SubmissionPanel clipJobId={jobId} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
