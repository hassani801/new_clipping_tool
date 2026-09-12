import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { UpdateTierDto } from './dto/update-tier.dto.js';
import { SubscriptionStatus, UserTier } from './user.entity.js';

/**
 * Manual tier management for QA/testing until real payment integration lands.
 * Admin-only: the JWT strategy re-fetches the user on every request, so a tier
 * change here takes effect on the target user's next request/job submission.
 */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers() {
    const users = await this.usersService.findAll();
    return users.map((u) => this.usersService.sanitizeUser(u));
  }

  @Patch(':id/tier')
  @HttpCode(HttpStatus.OK)
  async setUserTier(
    @Param('id') id: string,
    @Body() dto: UpdateTierDto,
  ) {
    const target = await this.usersService.findById(id);
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // A paid account must look subscribed to every tier check in the system;
    // dropping back to free clears the subscription state again.
    const status =
      dto.subscriptionStatus ??
      (dto.tier === UserTier.PAID
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.INACTIVE);

    const updated = await this.usersService.updateTier(
      id,
      dto.tier,
      status,
      null,
    );

    return {
      message: `User ${updated.email} tier set to ${updated.tier}`,
      user: this.usersService.sanitizeUser(updated),
    };
  }
}
