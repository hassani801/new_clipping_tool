import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { TierService } from './tier.service.js';
import { User, UserTier, SubscriptionStatus } from '../users/user.entity.js';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('TierService', () => {
  let service: TierService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      FREE_TIER_MAX_DURATION_SECONDS: '600',
      FREE_TIER_MAX_CLIPS: '3',
      FREE_TIER_DAILY_JOB_CAP: '2',
      PAID_TIER_MAX_DURATION_SECONDS: '1800',
      PAID_TIER_MAX_CLIPS: '10',
      PAID_TIER_DAILY_JOB_CAP: '50',
    });
    service = new TierService(configService);
  });

  it('should return correct limits for free tier', () => {
    const limits = service.getLimits(UserTier.FREE);
    expect(limits.tier).toBe('free');
    expect(limits.maxDurationSeconds).toBe(600);
    expect(limits.maxClips).toBe(3);
    expect(limits.dailyJobCap).toBe(2);
    expect(limits.transcriptionProvider).toBe('faster_whisper');
    expect(limits.watermark).toBe(true);
    expect(limits.priorityQueue).toBe(false);
  });

  it('should return correct limits for paid tier', () => {
    const limits = service.getLimits(UserTier.PAID);
    expect(limits.tier).toBe('paid');
    expect(limits.maxDurationSeconds).toBe(1800);
    expect(limits.maxClips).toBe(10);
    expect(limits.dailyJobCap).toBe(50);
    expect(limits.transcriptionProvider).toBe('deepgram');
    expect(limits.watermark).toBe(false);
    expect(limits.priorityQueue).toBe(true);
  });

  it('should throw ForbiddenException when free tier daily cap is reached', () => {
    const mockUser: User = {
      id: 'u-1',
      email: 'free@example.com',
      passwordHash: 'hash',
      tier: UserTier.FREE,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
      subscriptionExpiresAt: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobs: [],
    };

    expect(() => service.validateJobSubmission(mockUser, 2)).toThrow(
      ForbiddenException,
    );
  });

  it('should throw BadRequestException when clipCount exceeds tier limit', () => {
    const mockUser: User = {
      id: 'u-1',
      email: 'free@example.com',
      passwordHash: 'hash',
      tier: UserTier.FREE,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
      subscriptionExpiresAt: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobs: [],
    };

    expect(() => service.validateJobSubmission(mockUser, 0, 5)).toThrow(
      BadRequestException,
    );
  });

  it('should allow valid job submission within limits', () => {
    const mockUser: User = {
      id: 'u-2',
      email: 'paid@example.com',
      passwordHash: 'hash',
      tier: UserTier.PAID,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobs: [],
    };

    const limits = service.validateJobSubmission(mockUser, 5, 8);
    expect(limits.tier).toBe(UserTier.PAID);
  });
});
