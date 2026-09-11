import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignSubmissionDto } from './dto/create-campaign-submission.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ── Public listing directory (no auth required) ───────────────────────────

  @Get('campaign-listings')
  listActiveListings(@Query('platformName') platformName?: string) {
    return this.campaignsService.findActiveListings(platformName);
  }

  @Get('campaign-listings/:id')
  getActiveListing(@Param('id') id: string) {
    return this.campaignsService.findActiveListingById(id);
  }

  // ── User-facing submission log (auth required) ────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('campaign-submissions')
  createSubmission(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignSubmissionDto,
  ) {
    return this.campaignsService.createSubmission(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaign-submissions/mine')
  listMySubmissions(@CurrentUser('id') userId: string) {
    return this.campaignsService.findMySubmissions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('campaign-submissions/:id')
  deleteMySubmission(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.campaignsService.deleteSubmission(id, userId);
  }
}
