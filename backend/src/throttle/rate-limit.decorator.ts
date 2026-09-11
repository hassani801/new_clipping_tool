import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA = 'app:rate_limit';
export const SKIP_RATE_LIMIT_METADATA = 'app:skip_rate_limit';

export interface RateLimitConfig {
  limit: number;
  ttl: number;
}

/**
 * Per-route rate limit override (replaces @nestjs/throttler's @Throttle).
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_METADATA, config);

/**
 * Opts a route out of rate limiting entirely.
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_METADATA, true);
