import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity.js';
import { Job } from './jobs/job.entity.js';
import { CampaignListing } from './campaigns/entities/campaign-listing.entity.js';
import { CampaignSubmissionLog } from './campaigns/entities/campaign-submission-log.entity.js';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema.js';
import { AddJobUpdatedAt1757000000000 } from './migrations/1757000000000-AddJobUpdatedAt.js';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH || process.env.DB_DATABASE || 'db.sqlite',
  entities: [User, Job, CampaignListing, CampaignSubmissionLog],
  migrations: [
    InitialSchema1700000000000,
    AddJobUpdatedAt1757000000000,
  ],
  synchronize: false,
  logging: false,
});
