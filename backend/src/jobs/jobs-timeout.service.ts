import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Job, JobStatus } from './job.entity.js';

/**
 * Safety net for jobs whose processing died without a terminal callback
 * (service crash, engine crash mid-render, lost network). Any job still
 * queued/processing whose updatedAt is older than JOB_TIMEOUT_MINUTES is
 * marked failed so the frontend stops spinning. This only updates stale
 * records — it never tries to resume or touch the engine.
 */
@Injectable()
export class JobsTimeoutService {
  private readonly logger = new Logger(JobsTimeoutService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async failStaleJobs(): Promise<void> {
    const timeoutMinutes = this.timeoutMinutes();
    const staleBefore = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const staleJobs = await this.jobRepository.find({
      where: {
        status: In([JobStatus.QUEUED, JobStatus.PROCESSING]),
        updatedAt: LessThan(staleBefore),
      },
    });

    if (staleJobs.length === 0) {
      return;
    }

    const now = new Date();
    for (const job of staleJobs) {
      job.status = JobStatus.FAILED;
      job.currentStage = 'failed';
      job.error = 'Job timed out — processing was interrupted';
      job.completedAt = now;
    }
    await this.jobRepository.save(staleJobs);

    this.logger.warn(
      `[timeout] marked ${staleJobs.length} stale job(s) as failed ` +
        `(no update for ${timeoutMinutes} minutes)`,
    );
  }

  private timeoutMinutes(): number {
    const raw = (process.env.JOB_TIMEOUT_MINUTES || '').trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  }
}
