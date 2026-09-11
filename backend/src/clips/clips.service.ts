import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { Job } from '../jobs/job.entity.js';
import { PythonEngineService } from '../python-engine/python-engine.service.js';

@Injectable()
export class ClipsService {
  private readonly logger = new Logger(ClipsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly pythonEngine: PythonEngineService,
  ) {}

  /**
   * Streams a clip video with HTTP Range request handling and ownership protection
   */
  async streamClip(
    jobId: string,
    filename: string,
    userId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    // 1. Ownership check
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID "${jobId}" not found`);
    }

    if (job.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to clips for this job',
      );
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);

    // 2. Check local file paths first
    const candidatePaths = [
      path.resolve(process.cwd(), 'storage', 'clips', jobId, safeFilename),
      path.resolve(process.cwd(), 'clips', jobId, safeFilename),
      path.resolve(process.cwd(), 'storage', safeFilename),
      path.resolve(process.cwd(), safeFilename),
    ];

    let foundLocalPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        foundLocalPath = p;
        break;
      }
    }

    // 3. If found locally, stream with HTTP Range support
    if (foundLocalPath) {
      this.streamLocalFile(foundLocalPath, req, res);
      return;
    }

    // 4. If not found locally, proxy stream from the Python video engine
    const engineJobId = job.engineJobId || job.id;
    try {
      const rangeHeader = req.headers.range;
      const proxyResult = await this.pythonEngine.getClipStream(
        engineJobId,
        safeFilename,
        rangeHeader,
      );

      res.status(proxyResult.status);
      for (const [key, value] of Object.entries(proxyResult.headers)) {
        res.setHeader(key, value);
      }

      proxyResult.stream.pipe(res);
      return;
    } catch (err: any) {
      this.logger.error(
        `Failed to proxy clip "${safeFilename}" for job ${jobId} from Python engine: ${err.message}`,
      );
      throw new NotFoundException(
        `Clip "${safeFilename}" for job ${jobId} could not be located or streamed`,
      );
    }
  }

  /**
   * Helper to stream a local file handling HTTP Range headers (206 Partial Content)
   */
  private streamLocalFile(
    filePath: string,
    req: Request,
    res: Response,
  ): void {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse Range header, e.g. "bytes=32324-" or "bytes=0-1048575"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
      });

      fileStream.pipe(res);
    } else {
      // Full file delivery
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }
}
