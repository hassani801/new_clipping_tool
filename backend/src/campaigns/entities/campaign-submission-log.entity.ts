import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity.js';
import { CampaignListing } from './campaign-listing.entity.js';

@Entity('campaign_submission_logs')
export class CampaignSubmissionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  campaignListingId: string | null;

  @ManyToOne(() => CampaignListing, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'campaignListingId' })
  campaignListing: CampaignListing | null;

  @Column({ type: 'varchar', nullable: true })
  freeTextPlatformName: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  clipJobId: string | null;

  @Column({ type: 'varchar', length: 2048 })
  postUrl: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
