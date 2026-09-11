import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserTier {
  FREE = 'free',
  PAID = 'paid',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({
    type: 'varchar',
    default: UserTier.FREE,
  })
  tier: UserTier;

  @Column({
    type: 'varchar',
    default: SubscriptionStatus.INACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: 'datetime', nullable: true })
  subscriptionExpiresAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
