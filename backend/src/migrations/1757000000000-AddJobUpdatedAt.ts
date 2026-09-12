import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobUpdatedAt1757000000000 implements MigrationInterface {
  name = 'AddJobUpdatedAt1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing rows backfill with the migration time, NOT their createdAt:
    // jobs that were mid-flight when this column appeared keep a fresh clock,
    // so a deploy can never instantly fail work that is still running.
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite (≤3.35) cannot drop columns; recreate the table without it.
    await queryRunner.query(`
      CREATE TABLE "jobs_new" (
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
      INSERT INTO "jobs_new"
        ("id", "userId", "sourceUrl", "status", "currentStage", "progressPercent",
         "options", "clipsData", "engineJobId", "error", "createdAt", "completedAt")
      SELECT
        "id", "userId", "sourceUrl", "status", "currentStage", "progressPercent",
        "options", "clipsData", "engineJobId", "error", "createdAt", "completedAt"
      FROM "jobs"
    `);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`ALTER TABLE "jobs_new" RENAME TO "jobs"`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_79ae682707059d5f7655db4212" ON "jobs" ("userId")
    `);
  }
}
