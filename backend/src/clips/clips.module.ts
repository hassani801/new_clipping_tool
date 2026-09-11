import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ClipsController } from './clips.controller.js';
import { ClipsService } from './clips.service.js';
import { Job } from '../jobs/job.entity.js';
import { PythonEngineModule } from '../python-engine/python-engine.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    PythonEngineModule,
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ClipsController],
  providers: [ClipsService],
  exports: [ClipsService],
})
export class ClipsModule {}
