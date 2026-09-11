import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InternalJobsService } from './internal-jobs.service.js';
import { EngineSecretGuard } from './engine-secret.guard.js';

/**
 * Internal endpoints called by the python-service (not the frontend).
 * Auth = shared engine secret, never a user JWT.
 */
@UseGuards(EngineSecretGuard)
@Controller('internal/jobs')
export class InternalJobsController {
  constructor(private readonly internalJobsService: InternalJobsService) {}

  @Post(':id/result')
  @HttpCode(HttpStatus.OK)
  async onJobResult(@Param('id') id: string, @Body() body: any) {
    return this.internalJobsService.applyResult(id, body);
  }
}
