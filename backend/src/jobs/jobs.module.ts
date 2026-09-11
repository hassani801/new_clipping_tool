import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Job } from './job.entity.js';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { UsersModule } from '../users/users.module.js';
import { TierModule } from '../tier/tier.module.js';
import { PythonEngineModule } from '../python-engine/python-engine.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    UsersModule,
    TierModule,
    PythonEngineModule,
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService, TypeOrmModule],
})
export class JobsModule {}
