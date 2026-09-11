import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignListingDto } from './dto/create-campaign-listing.dto.js';
import { UpdateCampaignListingDto } from './dto/update-campaign-listing.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/campaign-listings')
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignListingDto) {
    return this.campaignsService.createListing(dto);
  }

  @Get()
  listAll() {
    return this.campaignsService.findAllListings(true);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignListingDto) {
    return this.campaignsService.updateListing(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.deleteListing(id);
  }
}
