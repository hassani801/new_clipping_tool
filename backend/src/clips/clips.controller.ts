import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClipsService } from './clips.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('clips')
export class ClipsController {
  constructor(private readonly clipsService: ClipsService) {}

  /**
   * Serves or proxies a generated clip video file with HTTP Range support
   */
  @Get(':jobId/:filename')
  async streamClip(
    @Param('jobId') jobId: string,
    @Param('filename') filename: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.clipsService.streamClip(jobId, filename, userId, req, res);
  }
}
