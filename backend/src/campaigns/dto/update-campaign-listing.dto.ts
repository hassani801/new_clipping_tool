import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignListingDto } from './create-campaign-listing.dto.js';

export class UpdateCampaignListingDto extends PartialType(
  CreateCampaignListingDto,
) {}
