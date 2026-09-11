import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PythonEngineService } from './python-engine.service.js';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [PythonEngineService],
  exports: [PythonEngineService],
})
export class PythonEngineModule {}
