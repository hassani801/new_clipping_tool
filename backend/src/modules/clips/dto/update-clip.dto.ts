import { PartialType } from '@nestjs/mapped-types';
import { CreateClipDto } from './create-clip.dto.js';

export class UpdateClipDto extends PartialType(CreateClipDto) {}
