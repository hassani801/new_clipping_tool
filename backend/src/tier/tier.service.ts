import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserTier } from '../users/user.entity.js';

export interface TierLimits {
  tier: UserTier;
  maxDurationSeconds: number;
  maxClips: number;
  dailyJobCap: number;
  transcriptionProvider: 'faster_whisper' | 'deepgram';
  watermark: boolean;
  maxResolution: '720p' | '4k';
  priorityQueue: boolean;
}

@Injectable()
export class TierService {
  constructor(private readonly config: ConfigService) {}

  getLimits(tier: UserTier | string = UserTier.FREE): TierLimits {
    const isPaid = tier === UserTier.PAID;

    if (isPaid) {
      return {
        tier: UserTier.PAID,
        maxDurationSeconds: parseInt(
          this.config.get<string>('PAID_TIER_MAX_DURATION_SECONDS', '1800'),
          10,
        ),
        maxClips: parseInt(
          this.config.get<string>('PAID_TIER_MAX_CLIPS', '10'),
          10,
        ),
        dailyJobCap: parseInt(
          this.config.get<string>('PAID_TIER_DAILY_JOB_CAP', '50'),
          10,
        ),
        transcriptionProvider: 'deepgram',
        watermark: false,
        maxResolution: '4k',
        priorityQueue: true,
      };
    }

    return {
      tier: UserTier.FREE,
      maxDurationSeconds: parseInt(
        this.config.get<string>('FREE_TIER_MAX_DURATION_SECONDS', '600'),
        10,
      ),
      maxClips: parseInt(
        this.config.get<string>('FREE_TIER_MAX_CLIPS', '3'),
        10,
      ),
      dailyJobCap: parseInt(
        this.config.get<string>('FREE_TIER_DAILY_JOB_CAP', '2'),
        10,
      ),
      transcriptionProvider: 'faster_whisper',
      watermark: true,
      maxResolution: '720p',
      priorityQueue: false,
    };
  }

  validateJobSubmission(
    user: User,
    jobsCreatedInLast24Hours: number,
    requestedClipCount?: number,
  ): TierLimits {
    const limits = this.getLimits(user.tier);

    if (jobsCreatedInLast24Hours >= limits.dailyJobCap) {
      throw new ForbiddenException(
        `Daily job limit reached (${jobsCreatedInLast24Hours}/${limits.dailyJobCap} jobs). Upgrade to Paid/Pro for increased limits.`,
      );
    }

    if (requestedClipCount && requestedClipCount > limits.maxClips) {
      throw new BadRequestException(
        `Clip count of ${requestedClipCount} exceeds the maximum allowed for ${user.tier} tier (${limits.maxClips} clips max).`,
      );
    }

    return limits;
  }

  enrichJobOptions(
    user: User,
    options: Record<string, any> = {},
  ): Record<string, any> {
    const limits = this.getLimits(user.tier);
    return {
      ...options,
      tier: user.tier,
      transcriptionProvider: limits.transcriptionProvider,
      durationLimitSeconds: limits.maxDurationSeconds,
      clipCount: options.clipCount
        ? Math.min(options.clipCount, limits.maxClips)
        : limits.maxClips,
      watermark: limits.watermark,
      priorityQueue: limits.priorityQueue,
    };
  }
}
