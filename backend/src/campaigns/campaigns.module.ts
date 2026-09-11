import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CampaignListing } from './entities/campaign-listing.entity.js';
import { CampaignSubmissionLog } from './entities/campaign-submission-log.entity.js';
import { CampaignsService } from './campaigns.service.js';
import { CampaignsController } from './campaigns.controller.js';
import { AdminCampaignsController } from './admin-campaigns.controller.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignListing, CampaignSubmissionLog]),
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [CampaignsController, AdminCampaignsController],
  providers: [CampaignsService, AdminGuard],
  exports: [CampaignsService],
})
export class CampaignsModule {}
