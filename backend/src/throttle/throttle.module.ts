import { Module, DynamicModule, Global } from '@nestjs/common';
import {
  RateLimitGuard,
  ThrottleWindowConfig,
  THROTTLE_OPTIONS,
} from './rate-limit.guard.js';

export interface ThrottleModuleConfig extends ThrottleWindowConfig {}

/**
 * Drop-in replacement for @nestjs/throttler's ThrottlerModule.forRoot([...]).
 * Accepts the same [{ ttl, limit }] array shape and registers RateLimitGuard.
 */
@Global()
@Module({})
export class ThrottleModule {
  static forRoot(configs: ThrottleModuleConfig[]): DynamicModule {
    const primary = configs[0] || { ttl: 60000, limit: 30 };
    return {
      module: ThrottleModule,
      providers: [
        {
          provide: THROTTLE_OPTIONS,
          useValue: primary,
        },
        RateLimitGuard,
      ],
      exports: [THROTTLE_OPTIONS, RateLimitGuard],
    };
  }
}
