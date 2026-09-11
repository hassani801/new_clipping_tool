import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottleModule } from './throttle/throttle.module.js';
import { RateLimitGuard } from './throttle/rate-limit.guard.js';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { User } from './users/user.entity.js';
import { Job } from './jobs/job.entity.js';
import { CampaignListing } from './campaigns/entities/campaign-listing.entity.js';
import { CampaignSubmissionLog } from './campaigns/entities/campaign-submission-log.entity.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ClipsModule } from './clips/clips.module.js';
import { TierModule } from './tier/tier.module.js';
import { PythonEngineModule } from './python-engine/python-engine.module.js';
import { HealthModule } from './health/health.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { InternalJobsModule } from './internal/internal-jobs.module.js';

import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema.js';

@Module({
  imports: [
    // ── Global Config (.env) ───────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Rate Limiting (in-house fixed-window limiter) ───────────────────────
    ThrottleModule.forRoot([
      {
        ttl: 60000,
        limit: 30, // 30 requests per minute default
      },
    ]),

    // ── Database (SQLite via better-sqlite3 with TypeORM) ──────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'better-sqlite3',
          database:
            config.get<string>('DATABASE_PATH') ||
            config.get<string>('DB_DATABASE', 'db.sqlite'),
          entities: [User, Job, CampaignListing, CampaignSubmissionLog],
          migrations: [InitialSchema1700000000000],
          migrationsRun: isProd,
          synchronize: !isProd, // auto-sync only in development; migrations in production
          logging: false,
        };
      },
    }),

    // ── Core Application Feature Modules ──────────────────────────────────
    AuthModule,
    UsersModule,
    JobsModule,
    ClipsModule,
    TierModule,
    PythonEngineModule,
    HealthModule,
    CampaignsModule,
    InternalJobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
