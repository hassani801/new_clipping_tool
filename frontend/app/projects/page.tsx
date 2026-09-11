'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Search,
  PlusCircle,
  Video,
  ArrowRight,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getJobs, JobInfo } from '@/lib/api-client';

type StatusFilter = 'all' | 'completed' | 'processing' | 'queued' | 'failed';

function statusBadge(status: JobInfo['status']) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'failed':
      return <Badge variant="warning">Failed</Badge>;
    case 'processing':
      return <Badge variant="gradient">Processing</Badge>;
    default:
      return <Badge variant="default">Queued</Badge>;
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJobs()
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.sourceUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
              Video Projects & History
            </h1>
            <p className="text-xs text-[#A1A1AA]">
              All your submitted clipping jobs — click any to view generated clips
            </p>
          </div>

          <Link href="/create">
            <Button variant="primary" size="md">
              <PlusCircle className="w-4 h-4" />
              <span>New Video Job</span>
            </Button>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by video URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-pink-500 transition"
            />
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141418] border border-white/10 text-xs self-stretch sm:self-auto">
            {(['all', 'completed', 'processing', 'queued', 'failed'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                  statusFilter === s
                    ? 'bg-[#1C1C22] text-[#F5F5F7] border border-white/10 shadow-sm'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load your projects"
            description={error}
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No matching jobs found"
            description={
              jobs.length === 0
                ? 'Paste a YouTube link or upload an MP4 to let AI automatically generate high-converting 9:16 vertical clips.'
                : 'Try changing your search query or status filter.'
            }
            actionLabel="Create First Clip"
            onAction={() => router.push('/create')}
          />
        ) : (
          <div className="rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                        <span className="capitalize">{job.currentStage}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {statusBadge(job.status)}
                    {(job.status === 'completed' || job.status === 'failed') && (
                      <Link href={`/results/${job.id}`}>
                        <Button variant="secondary" size="sm">
                          <span>{job.status === 'completed' ? 'View Clips' : 'Details'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                    {(job.status === 'queued' || job.status === 'processing') && (
                      <Link href={`/processing/${job.id}`}>
                        <Button variant="secondary" size="sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
