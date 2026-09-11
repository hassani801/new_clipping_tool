import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Job } from '../../jobs/job.entity.js';

@Injectable()
export class JobOwnershipGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    const jobId =
      request.params?.id || request.params?.jobId || request.body?.jobId;
    if (!jobId) {
      return true; // No job ID in params/body to check
    }

    const jobRepo = this.dataSource.getRepository(Job);
    const job = await jobRepo.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found`);
    }

    if (job.userId !== user.id) {
      throw new ForbiddenException(
        'Access denied: You do not own this job or its associated clips',
      );
    }

    // Attach verified job to request for convenience
    request.job = job;
    return true;
  }
}
