import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PythonEngineModule } from '../python-engine/python-engine.module.js';

@Module({
  imports: [PythonEngineModule],
  controllers: [HealthController],
})
export class HealthModule {}
