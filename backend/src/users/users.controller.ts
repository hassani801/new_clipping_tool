import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './user.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UpdateTierDto } from './dto/update-tier.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.usersService.sanitizeUser(user);
  }

  /**
   * Self-service profile update (display name only — email/password changes
   * are out of scope until account management lands).
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(userId, {
      name: updateDto.name,
    });
    return {
      message: 'Profile updated',
      user: this.usersService.sanitizeUser(updated),
    };
  }

  /**
   * Admin-only tier/subscription update (real billing will drive this via a
   * payment webhook; until then it must not let a user self-escalate).
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('tier')
  @HttpCode(HttpStatus.OK)
  async updateTier(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateTierDto,
  ) {
    const expiresAt = updateDto.subscriptionExpiresAt
      ? new Date(updateDto.subscriptionExpiresAt)
      : null;

    const updated = await this.usersService.updateTier(
      userId,
      updateDto.tier,
      updateDto.subscriptionStatus,
      expiresAt,
    );

    return {
      message: `Tier successfully updated to ${updated.tier}`,
      user: this.usersService.sanitizeUser(updated),
    };
  }
}
