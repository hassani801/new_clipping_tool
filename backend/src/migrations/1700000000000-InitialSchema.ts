import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar,
        "passwordHash" varchar NOT NULL,
        "tier" varchar NOT NULL DEFAULT ('free'),
        "subscriptionStatus" varchar NOT NULL DEFAULT ('inactive'),
        "subscriptionExpiresAt" datetime,
        "isVerified" boolean NOT NULL DEFAULT (0),
        "isAdmin" boolean NOT NULL DEFAULT (0),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaign_listings" (
        "id" varchar PRIMARY KEY NOT NULL,
        "platformName" varchar(255) NOT NULL,
        "platformLogoUrl" varchar,
        "campaignTitle" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "sourceVideoUrl" varchar,
        "ratePerThousandViews" varchar NOT NULL,
        "requirements" text,
        "externalJoinUrl" varchar NOT NULL,
        "externalSubmissionUrl" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" varchar PRIMARY KEY NOT NULL,
        "userId" varchar NOT NULL,
        "sourceUrl" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT ('queued'),
        "currentStage" varchar NOT NULL DEFAULT ('queued'),
        "progressPercent" float NOT NULL DEFAULT (0),
        "options" text,
        "clipsData" text,
        "engineJobId" varchar,
        "error" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "completedAt" datetime,
        CONSTRAINT "FK_79ae682707059d5f7655db4212a" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_79ae682707059d5f7655db4212" ON "jobs" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaign_submission_logs" (
        "id" varchar PRIMARY KEY NOT NULL,
        "userId" varchar NOT NULL,
        "campaignListingId" varchar,
        "freeTextPlatformName" varchar,
        "clipJobId" varchar,
        "postUrl" varchar(2048) NOT NULL,
        "submittedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "notes" text,
        CONSTRAINT "FK_d58cb65a49b343342f5419d93c0" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_d1bf5f9e18c158fd9a8f844501d" FOREIGN KEY ("campaignListingId") REFERENCES "campaign_listings" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_d58cb65a49b343342f5419d93c" ON "campaign_submission_logs" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_d1bf5f9e18c158fd9a8f844501" ON "campaign_submission_logs" ("campaignListingId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_d63aa86affd01ea0058ce797a2" ON "campaign_submission_logs" ("clipJobId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_submission_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_listings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
