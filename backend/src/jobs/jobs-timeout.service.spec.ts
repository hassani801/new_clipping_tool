import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsTimeoutService } from './jobs-timeout.service.js';
import { Job, JobStatus } from './job.entity.js';

function makeJob(
  status: JobStatus,
  updatedMinutesAgo: number,
): Job {
  const job = new Job();
  job.id = `job-${Math.random().toString(36).slice(2)}`;
  job.userId = 'u-1';
  job.sourceUrl = 'https://example.com/v.mp4';
  job.status = status;
  job.currentStage = 'reframing';
  job.progressPercent = 42;
  job.options = null;
  job.clipsData = null;
  job.engineJobId = null;
  job.error = null;
  job.createdAt = new Date();
  job.updatedAt = new Date(Date.now() - updatedMinutesAgo * 60 * 1000);
  job.completedAt = null;
  return job;
}

describe('JobsTimeoutService', () => {
  let service: JobsTimeoutService;
  let allJobs: Job[];
  let saved: Job[];

  const fakeRepository = {
    async find(opts: { where: { status: any; updatedAt: any } }) {
      const statuses: JobStatus[] = opts.where.status.value;
      const cutoff: Date = opts.where.updatedAt.value;
      return allJobs.filter(
        (j) => statuses.includes(j.status) && j.updatedAt < cutoff,
      );
    },
    async save(jobs: Job[]) {
      saved.push(...jobs);
      return jobs;
    },
  };

  beforeEach(() => {
    vi.stubEnv('JOB_TIMEOUT_MINUTES', '20');
    allJobs = [];
    saved = [];
    service = new JobsTimeoutService(fakeRepository as any);
  });

  it('marks stale processing and queued jobs as failed with a reason', async () => {
    const staleProcessing = makeJob(JobStatus.PROCESSING, 25);
    const staleQueued = makeJob(JobStatus.QUEUED, 40);
    allJobs = [staleProcessing, staleQueued];

    await service.failStaleJobs();

    expect(staleProcessing.status).toBe(JobStatus.FAILED);
    expect(staleProcessing.currentStage).toBe('failed');
    expect(staleProcessing.error).toBe(
      'Job timed out — processing was interrupted',
    );
    expect(staleProcessing.completedAt).not.toBeNull();
    expect(staleQueued.status).toBe(JobStatus.FAILED);
    expect(saved).toContain(staleProcessing);
    expect(saved).toContain(staleQueued);
  });

  it('leaves fresh active jobs and completed jobs untouched', async () => {
    const fresh = makeJob(JobStatus.PROCESSING, 5);
    const completed = makeJob(JobStatus.COMPLETED, 60);
    const failed = makeJob(JobStatus.FAILED, 60);
    allJobs = [fresh, completed, failed];

    await service.failStaleJobs();

    expect(fresh.status).toBe(JobStatus.PROCESSING);
    expect(completed.status).toBe(JobStatus.COMPLETED);
    expect(failed.status).toBe(JobStatus.FAILED);
    expect(saved).toHaveLength(0);
  });

  it('does nothing when no stale jobs are found', async () => {
    await service.failStaleJobs();
    expect(saved).toHaveLength(0);
  });

  it('defaults to 20 minutes when JOB_TIMEOUT_MINUTES is unset or invalid', async () => {
    vi.stubEnv('JOB_TIMEOUT_MINUTES', '');
    service = new JobsTimeoutService(fakeRepository as any);
    const stale = makeJob(JobStatus.PROCESSING, 25);
    const borderline = makeJob(JobStatus.PROCESSING, 19);
    allJobs = [stale, borderline];

    await service.failStaleJobs();

    expect(saved).toContain(stale);
    expect(saved).not.toContain(borderline);
  });
});
