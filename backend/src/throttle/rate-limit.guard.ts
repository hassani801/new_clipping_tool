import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_METADATA,
  SKIP_RATE_LIMIT_METADATA,
  RateLimitConfig,
} from './rate-limit.decorator.js';

export interface ThrottleWindowConfig {
  ttl: number;
  limit: number;
}

export const THROTTLE_OPTIONS = 'THROTTLE_OPTIONS';

interface HitWindow {
  count: number;
  resetAt: number;
}

/**
 * Minimal fixed-window per-IP+route rate limiter (in-memory).
 *
 * Replaces @nestjs/throttler (which caps @nestjs/core support at v11 and is
 * therefore incompatible with the v12 stack). The sliding behaviour is not
 * needed for the endpoints it protects (auth login/signup).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, HitWindow>();

  constructor(
    @Inject(THROTTLE_OPTIONS)
    private readonly defaultOptions: ThrottleWindowConfig,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const cls = context.getClass();

    if (
      this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_METADATA, [
        handler,
        cls,
      ])
    ) {
      return true;
    }

    const config =
      this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_METADATA, [
        handler,
        cls,
      ]) || this.defaultOptions;

    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.originalUrl || request.url;
    const key = `${request.ip}:${request.method}:${route}`;

    const now = Date.now();
    let entry = this.hits.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 1, resetAt: now + config.ttl };
      this.hits.set(key, entry);
      this.prune(now);
      return true;
    }

    entry.count += 1;
    if (entry.count > config.limit) {
      const retryAfterMs = Math.max(0, entry.resetAt - now);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later.',
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private prune(now: number): void {
    if (this.hits.size < 10000) return;
    for (const [key, entry] of this.hits) {
      if (now >= entry.resetAt) {
        this.hits.delete(key);
      }
    }
  }
}
