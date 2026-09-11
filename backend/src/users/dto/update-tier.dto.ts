import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { UserTier, SubscriptionStatus } from '../user.entity.js';

export class UpdateTierDto {
  @IsEnum(UserTier)
  tier: UserTier;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @IsOptional()
  @IsDateString()
  subscriptionExpiresAt?: string;
}
