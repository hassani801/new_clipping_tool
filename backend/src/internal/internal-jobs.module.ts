import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/job.entity.js';
import { InternalJobsController } from './internal-jobs.controller.js';
import { InternalJobsService } from './internal-jobs.service.js';
import { EngineSecretGuard } from './engine-secret.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [InternalJobsController],
  providers: [InternalJobsService, EngineSecretGuard],
})
export class InternalJobsModule {}
