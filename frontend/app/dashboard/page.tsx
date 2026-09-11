'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Video,
  ArrowRight,
  FolderKanban,
  Flame,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getMe, toUserProfile, getJobs, JobInfo } from '@/lib/api-client';
import { UserProfile } from '@/lib/types';

function statusBadge(job: JobInfo) {
  switch (job.status) {
    case 'completed':
      return <Badge variant="success">{job.currentStage === 'completed' ? 'Completed' : 'Completed'}</Badge>;
    case 'failed':
      return <Badge variant="warning">Failed</Badge>;
    default:
      return <Badge variant="gradient">{job.progressPercent}%</Badge>;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMe()
      .then((u) => {
        if (active && u) setUser(toUserProfile(u));
      })
      .catch(() => {});

    getJobs()
      .then((list) => {
        if (!active) return;
        setJobs(list);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const completed = jobs.filter((j) => j.status === 'completed').length;
  const inProgress = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'processing',
  ).length;
  const failed = jobs.filter((j) => j.status === 'failed').length;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Header & Quick Action Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Creator'}
              </h1>
              <Badge variant={user?.tier === 'pro' ? 'pro' : 'default'}>
                {user?.tier === 'pro' ? 'PRO' : 'FREE'}
              </Badge>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Your AI clipping studio is ready to generate next-generation vertical shorts.
            </p>
          </div>

          <Link href="/create">
            <Button variant="primary" size="md" className="shadow-lg shadow-pink-500/20">
              <PlusCircle className="w-4 h-4" />
              <span>Create New Clip</span>
            </Button>
          </Link>
        </div>

        {/* Quick Stats (real job counts) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {[
            {
              label: 'Total Jobs',
              value: jobs.length.toString(),
              icon: FolderKanban,
              color: 'text-violet-400',
            },
            {
              label: 'Completed',
              value: completed.toString(),
              icon: CheckCircle2,
              color: 'text-emerald-400',
            },
            {
              label: 'In Progress',
              value: inProgress.toString(),
              icon: Clock,
              color: 'text-amber-400',
            },
            {
              label: 'Failed',
              value: failed.toString(),
              icon: AlertCircle,
              color: 'text-rose-400',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/[0.08] flex items-center gap-3"
              >
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-[#F5F5F7] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-[#71717A]">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7] flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-500 fill-current" />
                <span>Your Processing Jobs</span>
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Real jobs submitted to the AI clipping pipeline
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load your jobs"
              description={error}
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No jobs yet"
              description="Paste a YouTube link or upload an MP4 to let AI automatically generate high-converting 9:16 vertical clips."
              actionLabel="Create First Clip"
              onAction={() => router.push('/create')}
            />
          ) : (
            <div className="rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600/20 to-pink-500/20 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F5F5F7] truncate max-w-md">
                          {job.sourceUrl}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[#71717A] mt-0.5">
                          <span>{new Date(job.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{job.options?.clipCount ?? '—'} clips</span>
                          <span>•</span>
                          <span>{job.currentStage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {statusBadge(job)}
                      {(job.status === 'completed' || job.status === 'failed') && (
                        <Link href={`/results/${job.id}`}>
                          <Button variant="secondary" size="sm">
                            <span>{job.status === 'completed' ? 'View Clips' : 'Details'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
