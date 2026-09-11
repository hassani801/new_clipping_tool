'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Server,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Video,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PROCESSING_STAGES } from '@/lib/constants';
import { getJob, JobInfo } from '@/lib/api-client';
import confetti from 'canvas-confetti';

const STAGE_TO_INDEX: Record<string, number> = {
  queued: 0,
  downloading: 0,
  initializing: 0,
  analyzing: 1,
  transcribing: 1,
  finding_moments: 2,
  reframing: 3,
  clipping: 3,
  captions: 4,
  finalizing: 5,
  completed: 5,
};

export default function ProcessingPage() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('jobId');
    const t = window.setTimeout(() => {
      if (id) {
        setJobId(id);
      } else {
        setError('No job id provided — start a clip from the Create page.');
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const fresh = await getJob(jobId);
      setJob(fresh);
      if (fresh.status === 'completed') {
        setIsCompleted(true);
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } else if (fresh.status === 'failed') {
        setFailed(fresh.error || 'Video processing failed');
      }
    } catch (err) {
      const apiError = err as { status?: number; message?: string };
      if (apiError?.status === 401) {
        router.push('/login');
        return;
      }
      setError(
        `Couldn't reach the processing pipeline (${apiError?.message || 'unknown error'}). The job was not silently simulated.`,
      );
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!jobId || isCompleted || failed) return;
    const first = window.setTimeout(poll, 0);
    const interval = setInterval(poll, 2000);
    return () => {
      window.clearTimeout(first);
      clearInterval(interval);
    };
  }, [jobId, isCompleted, failed, poll]);

  const progress = job?.progressPercent ?? 0;
  const stageIdx = job ? STAGE_TO_INDEX[job.currentStage] ?? 0 : 0;
  const currentStage = PROCESSING_STAGES[stageIdx] || PROCESSING_STAGES[0];
  const stageMessage = job?.error || null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8">
        {/* Top Queue Status Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141418] border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600/20 to-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#F5F5F7] block">
                AI Processing Pipeline
              </span>
              <span className="text-[11px] text-[#A1A1AA]">
                Job <span className="font-mono text-[#F5F5F7]">{jobId ? jobId.slice(0, 8) : '…'}</span> • Live engine progress
              </span>
            </div>
          </div>

          <Badge variant="gradient" size="md">
            {failed ? 'Failed' : isCompleted ? 'Finished' : 'Rendering'}
          </Badge>
        </div>

        {/* Central Progress Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#141418] border border-white/10 shadow-2xl shadow-black relative overflow-hidden flex flex-col items-center text-center space-y-6">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-violet-600/20 via-pink-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 shadow-2xl shadow-pink-500/25">
              <div className="w-full h-full bg-[#0A0A0C] rounded-[22px] flex items-center justify-center text-pink-400">
                {failed ? (
                  <AlertCircle className="w-10 h-10 text-rose-400" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                ) : (
                  <Sparkles className="w-10 h-10 text-pink-400 animate-pulse" />
                )}
              </div>
            </div>
            {!isCompleted && !failed && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500" />
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-md">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400">
              Stage {stageIdx + 1} of {PROCESSING_STAGES.length}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                  {failed
                    ? 'Processing Failed'
                    : isCompleted
                    ? 'Clips Ready to Review!'
                    : currentStage.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                  {failed
                    ? failed
                    : isCompleted
                    ? 'All 9:16 vertical shorts generated with transcripts, hook scores, and kinetic captions.'
                    : stageMessage || currentStage.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full max-w-lg space-y-2">
            <ProgressBar
              value={failed ? 100 : Math.max(progress, stageIdx > 0 ? 8 : 2)}
              size="lg"
              animatedGlow
            />
            <div className="flex justify-between items-center text-xs text-[#71717A] px-1 font-mono">
              <span>Progress: {failed ? '—' : `${Math.min(100, progress)}%`}</span>
              <span>{failed ? 'Engine error' : isCompleted ? 'Complete' : 'Live'}</span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 w-full max-w-md pt-2">
            {PROCESSING_STAGES.map((s, idx) => {
              const isPast = idx < stageIdx;
              const isCurrent = idx === stageIdx;
              return (
                <div
                  key={s.step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isPast || isCompleted
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500'
                      : isCurrent && !failed
                      ? 'bg-pink-400 animate-pulse'
                      : 'bg-white/10'
                  }`}
                  title={s.title}
                />
              );
            })}
          </div>

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/results/${jobId}`)}
                className="px-8 shadow-2xl shadow-pink-500/30"
              >
                <span>View Generated Clips</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {failed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4 flex items-center gap-3"
            >
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/create')}
              >
                <span>Try Another Video</span>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Source Video Summary Card */}
        {job && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/[0.08] flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white/5 text-pink-400 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[#A1A1AA] block text-[11px]">
                  Processing Source:
                </span>
                <p className="font-semibold text-[#F5F5F7] truncate">
                  {job.sourceUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="outline">{job.options?.clipCount ?? '—'} Clips</Badge>
              <Badge variant="outline">{job.options?.aspectRatio ?? '9:16'}</Badge>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
