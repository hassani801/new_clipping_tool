import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('campaign_listings')
export class CampaignListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  platformName: string;

  @Column({ type: 'varchar', nullable: true })
  platformLogoUrl: string | null;

  @Column({ type: 'varchar', length: 255 })
  campaignTitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  sourceVideoUrl: string | null;

  @Column({ type: 'varchar' })
  ratePerThousandViews: string;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ type: 'varchar' })
  externalJoinUrl: string;

  @Column({ type: 'varchar', nullable: true })
  externalSubmissionUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
