import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCampaignSubmissionDto {
  @IsOptional()
  @IsUUID()
  campaignListingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  freeTextPlatformName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  postUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clipJobId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
