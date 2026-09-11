import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import { PythonEngineService } from '../python-engine/python-engine.service.js';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly pythonEngine: PythonEngineService,
  ) {}

  @Get()
  async checkHealth(@Res({ passthrough: true }) res: Response) {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    // 1. Check Database connectivity
    let dbStatus = 'connected';
    let dbError: string | null = null;
    try {
      if (!this.dataSource.isInitialized) {
        dbStatus = 'disconnected';
      } else {
        await this.dataSource.query('SELECT 1');
      }
    } catch (err: any) {
      dbStatus = 'disconnected';
      dbError = err.message || 'Database query failed';
    }

    // 2. Check Python video processing service reachability
    const pythonHealth = await this.pythonEngine.checkHealth();

    // Determine overall status
    const isHealthy = dbStatus === 'connected';
    const overallStatus = !isHealthy
      ? 'down'
      : !pythonHealth.reachable
        ? 'degraded'
        : 'ok';

    if (!isHealthy) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          type: 'sqlite',
          error: dbError,
        },
        pythonEngine: {
          status: pythonHealth.reachable ? 'reachable' : 'unreachable',
          url: pythonHealth.url,
          latencyMs: pythonHealth.latencyMs,
          error: pythonHealth.error || null,
        },
      },
    };
  }
}
