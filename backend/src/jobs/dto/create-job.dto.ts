import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'Source video URL or uploaded reference is required' })
  sourceUrl: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  clipCount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['9:16', '1:1', '16:9'])
  aspectRatio?: string;

  @IsOptional()
  @IsBoolean()
  autoReframe?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['balanced', 'aggressive', 'conservative'])
  highlightSensitivity?: string;

  @IsOptional()
  @IsString()
  @IsIn(['karaoke'], {
    message:
      'captionPreset must be one of: karaoke (other styles are not implemented yet)',
  })
  captionPreset?: string;
}
