import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateCampaignListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  platformName: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  platformLogoUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  campaignTitle: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  sourceVideoUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ratePerThousandViews: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  externalJoinUrl: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  externalSubmissionUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
