import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import path from 'node:path';
import { Job, JobStatus, JobClipInfo } from '../jobs/job.entity.js';

interface CallbackClip {
  id?: string;
  title?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  score?: number;
  outputPath?: string | null;
  clipUrl?: string | null;
  hookSummary?: string;
  thumbnailPath?: string | null;
}

interface JobResultCallback {
  jobId?: string;
  status?: string;
  clips?: CallbackClip[];
  error?: { code?: string; message?: string; details?: unknown };
}

@Injectable()
export class InternalJobsService {
  private readonly logger = new Logger(InternalJobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Applies a job-result callback from the python-service. This is the fast
   * path: it updates the local Job record immediately, so the frontend's
   * polling sees completion without waiting for its next engine poll.
   */
  async applyResult(jobId: string, body: JobResultCallback): Promise<{ acknowledged: boolean; jobId: string }> {
    // The callback carries the engine-side job id, which the backend stores as
    // Job.engineJobId (not the row's primary id) — match either.
    const job = await this.jobRepository.findOne({
      where: [{ id: jobId }, { engineJobId: jobId }],
    });
    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found`);
    }

    const rawStatus = String(body.status || 'failed').toLowerCase();
    const completed = rawStatus === 'completed';

    job.status = completed ? JobStatus.COMPLETED : JobStatus.FAILED;
    job.currentStage = completed ? 'completed' : 'failed';
    job.completedAt = new Date();

    if (completed) {
      job.progressPercent = 100;
      job.error = null;
      job.clipsData = this.mapClips(job, body.clips || []);
      this.logger.log(
        `[internal] job ${jobId} completed with ${job.clipsData.length} clip(s)`,
      );
    } else {
      job.error =
        body.error?.message || `Engine processing failed (${rawStatus})`;
      this.logger.error(`[internal] job ${jobId} failed: ${job.error}`);
    }

    await this.jobRepository.save(job);
    return { acknowledged: true, jobId: job.id };
  }

  private mapClips(job: Job, clips: CallbackClip[]): JobClipInfo[] {
    const fallbackAspect = job.options?.aspectRatio || '9:16';
    return clips.map((c, idx) => ({
      id: c.id || `clip-${job.id}-${idx + 1}`,
      filename: c.outputPath
        ? path.basename(String(c.outputPath))
        : `clip_${idx + 1}.mp4`,
      title: c.title || `Viral Clip #${idx + 1}`,
      duration: typeof c.duration === 'number' ? c.duration : 0,
      viralityScore: typeof c.score === 'number' ? c.score : 0,
      hookSummary: c.hookSummary,
      tags: [],
      url: c.clipUrl || undefined,
      thumbnailUrl: c.thumbnailPath || undefined,
      aspectRatio: fallbackAspect,
      startTime: typeof c.startTime === 'number' ? c.startTime : undefined,
      endTime: typeof c.endTime === 'number' ? c.endTime : undefined,
    }));
  }
}
