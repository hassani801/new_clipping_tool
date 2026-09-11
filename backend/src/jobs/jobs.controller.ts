import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createJob(
    @CurrentUser() user: User,
    @Body() createJobDto: CreateJobDto,
  ) {
    const job = await this.jobsService.createJob(user.id, createJobDto);
    return {
      message: 'Job submitted successfully',
      jobId: job.id,
      job,
    };
  }

  @Get()
  async getJobs(@CurrentUser('id') userId: string) {
    const jobs = await this.jobsService.getUserJobs(userId);
    return {
      count: jobs.length,
      jobs,
    };
  }

  @Get(':id')
  async getJob(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const job = await this.jobsService.getJobById(id, userId);
    return job;
  }

  @Get(':id/clips')
  async getJobClips(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const clips = await this.jobsService.getJobClips(id, userId);
    return {
      jobId: id,
      count: clips.length,
      clips,
    };
  }
}
