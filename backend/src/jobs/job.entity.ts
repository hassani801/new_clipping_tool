import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity.js';

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface JobClipInfo {
  id: string;
  filename: string;
  title: string;
  duration: number;
  viralityScore: number;
  hookSummary?: string;
  tags?: string[];
  url?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  startTime?: number;
  endTime?: number;
}

export interface JobOptions {
  category?: string;
  clipCount?: number;
  aspectRatio?: string;
  autoReframe?: boolean;
  highlightSensitivity?: string;
  captionPreset?: string;
  transcriptionProvider?: string;
  tier?: string;
  durationLimitSeconds?: number;
  [key: string]: any;
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  sourceUrl: string;

  @Column({
    type: 'varchar',
    default: JobStatus.QUEUED,
  })
  status: JobStatus;

  @Column({ type: 'varchar', default: 'queued' })
  currentStage: string;

  @Column({ type: 'float', default: 0 })
  progressPercent: number;

  @Column({ type: 'simple-json', nullable: true })
  options: JobOptions | null;

  @Column({ type: 'simple-json', nullable: true })
  clipsData: JobClipInfo[] | null;

  @Column({ type: 'varchar', nullable: true })
  engineJobId: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // Refreshed on every save: the timeout sweep treats a stale updatedAt as
  // evidence the job (and its engine updates) died mid-render.
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;
}
