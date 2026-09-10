import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClipsService } from './clips.service.js';
import { CreateClipDto } from './dto/create-clip.dto.js';
import { UpdateClipDto } from './dto/update-clip.dto.js';

@Controller('clips')
export class ClipsController {
  constructor(private readonly clipsService: ClipsService) {}

  /** POST /api/clips */
  @Post()
  create(@Body() dto: CreateClipDto) {
    return this.clipsService.create(dto);
  }

  /** GET /api/clips?page=1&limit=20 */
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.clipsService.findAll(Number(page), Number(limit));
  }

  /** GET /api/clips/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clipsService.findOne(id);
  }

  /** PATCH /api/clips/:id */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClipDto,
  ) {
    return this.clipsService.update(id, dto);
  }

  /** DELETE /api/clips/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clipsService.remove(id);
  }
}
