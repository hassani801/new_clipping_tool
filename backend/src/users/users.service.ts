import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserTier, SubscriptionStatus } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.userRepository.findOne({ where: { email: normalizedEmail } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name?: string | null;
    tier?: UserTier;
    subscriptionStatus?: SubscriptionStatus;
  }): Promise<User> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      name: data.name ?? null,
      tier: data.tier || UserTier.FREE,
      subscriptionStatus: data.subscriptionStatus || SubscriptionStatus.INACTIVE,
      isVerified: false,
    });

    return this.userRepository.save(user);
  }

  /**
   * Stub for future payment webhook (e.g. Stripe, LemonSqueezy) to update user subscription
   */
  async updateTier(
    userId: string,
    tier: UserTier,
    subscriptionStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE,
    expiresAt: Date | null = null,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    user.tier = tier;
    user.subscriptionStatus = subscriptionStatus;
    user.subscriptionExpiresAt = expiresAt;

    return this.userRepository.save(user);
  }

  async updateVerification(userId: string, isVerified: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    user.isVerified = isVerified;
    return this.userRepository.save(user);
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
