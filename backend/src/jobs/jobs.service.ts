import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Job, JobStatus, JobClipInfo } from './job.entity.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UsersService } from '../users/users.service.js';
import { TierService } from '../tier/tier.service.js';
import { PythonEngineService } from '../python-engine/python-engine.service.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly usersService: UsersService,
    private readonly tierService: TierService,
    private readonly pythonEngine: PythonEngineService,
  ) {}

  /**
   * Validates tier limits, forwards to Python engine, and saves job record
   */
  async createJob(userId: string, createJobDto: CreateJobDto): Promise<Job> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Calculate user's jobs in the last 24 hours to enforce daily cap
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentJobsCount = await this.jobRepository.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(oneDayAgo),
      },
    });

    // 2. Validate limits based on database tier record
    this.tierService.validateJobSubmission(
      user,
      recentJobsCount,
      createJobDto.clipCount,
    );

    // 3. Enrich options with resolved tier and transcription provider
    const enrichedOptions = this.tierService.enrichJobOptions(user, {
      category: createJobDto.category || 'podcast',
      clipCount: createJobDto.clipCount || (user.tier === 'paid' ? 5 : 3),
      aspectRatio: createJobDto.aspectRatio || '9:16',
      autoReframe: createJobDto.autoReframe ?? true,
      highlightSensitivity: createJobDto.highlightSensitivity || 'balanced',
      captionPreset: createJobDto.captionPreset || 'karaoke',
    });

    // 4. Forward to the Python service (with the authenticated user id so the
    //    engine tier/provider routing uses our real tier, not its local stub)
    const pythonResponse = await this.pythonEngine.submitJob(
      createJobDto.sourceUrl,
      enrichedOptions,
      user.id,
    );

    // 5. Create local database record
    const job = this.jobRepository.create({
      userId,
      sourceUrl: createJobDto.sourceUrl,
      status: JobStatus.PROCESSING,
      currentStage: 'queued',
      progressPercent: 5,
      options: enrichedOptions,
      engineJobId: pythonResponse.jobId,
      error: null,
    });

    return this.jobRepository.save(job);
  }

  /**
   * Retrieves a job with ownership verification and polls python engine for fresh progress
   */
  async getJobById(jobId: string, requestingUserId: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID "${jobId}" not found`);
    }

    // Ownership check
    if (job.userId !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to view this job',
      );
    }

    // Poll python engine if job is currently active
    if (
      job.status === JobStatus.QUEUED ||
      job.status === JobStatus.PROCESSING
    ) {
      try {
        const engineId = job.engineJobId || job.id;
        const statusData = await this.pythonEngine.getJobStatus(engineId);

        let hasChanged = false;
        if (statusData.status && statusData.status !== job.status) {
          job.status = statusData.status as JobStatus;
          hasChanged = true;
        }
        if (
          typeof statusData.progress === 'number' &&
          statusData.progress !== job.progressPercent
        ) {
          job.progressPercent = statusData.progress;
          hasChanged = true;
        }
        if (statusData.stage && statusData.stage !== job.currentStage) {
          job.currentStage = statusData.stage;
          hasChanged = true;
        }

        if (job.status === JobStatus.COMPLETED) {
          job.completedAt = new Date();
          job.progressPercent = 100;
          job.currentStage = 'completed';
          hasChanged = true;

          // Fetch clips from Python engine
          const clips = await this.pythonEngine.getJobClips(engineId);
          if (clips && clips.length > 0) {
            job.clipsData = this.withAspectRatio(job, clips);
          }
        } else if (job.status === JobStatus.FAILED) {
          job.error = statusData.error || 'Video processing failed';
          job.completedAt = new Date();
          hasChanged = true;
        }

        if (hasChanged) {
          return await this.jobRepository.save(job);
        }
      } catch (err: any) {
        this.logger.debug(
          `Could not refresh live progress for job ${jobId}: ${err.message}`,
        );
      }
    }

    return job;
  }

  /**
   * Retrieves all jobs belonging to the authenticated user
   */
  async getUserJobs(userId: string): Promise<Job[]> {
    return this.jobRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves generated clips for a completed job with ownership verification
   */
  async getJobClips(jobId: string, requestingUserId: string) {
    const job = await this.getJobById(jobId, requestingUserId);

    if (job.clipsData && job.clipsData.length > 0) {
      return job.clipsData;
    }

    // Prefer clips already persisted by the internal callback; fall back to
    // fetching from the engine when the job completed without a callback.
    if (job.clipsData && job.clipsData.length > 0) {
      return job.clipsData;
    }

    if (job.status === JobStatus.COMPLETED) {
      const engineId = job.engineJobId || job.id;
      const clips = await this.pythonEngine.getJobClips(engineId);
      if (clips && clips.length > 0) {
        job.clipsData = this.withAspectRatio(job, clips);
        await this.jobRepository.save(job);
        return job.clipsData;
      }
    }

    return job.clipsData || [];
  }

  /**
   * Fills the display aspect ratio on engine clips from the job options.
   */
  private withAspectRatio(
    job: Job,
    clips: JobClipInfo[],
  ): JobClipInfo[] {
    const fallback = job.options?.aspectRatio || '9:16';
    return clips.map((c) => ({
      ...c,
      aspectRatio: c.aspectRatio || fallback,
    }));
  }
}
