import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export interface PythonJobSubmitResponse {
  jobId: string;
}

export interface PythonJobStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  message?: string;
  error?: string | null;
}

export interface PythonJobClipItem {
  id: string;
  filename: string;
  title: string;
  duration: number;
  viralityScore: number;
  hookSummary?: string;
  tags?: string[];
  url?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  startTime?: number;
  endTime?: number;
}

const DEFAULT_ENGINE_SECRET = 'change-me-secret-token';

function sensitivityToThreshold(sensitivity?: string): number {
  switch (sensitivity) {
    case 'aggressive':
      return 60;
    case 'conservative':
      return 85;
    default:
      return 75;
  }
}

@Injectable()
export class PythonEngineService {
  private readonly logger = new Logger(PythonEngineService.name);
  private readonly baseUrl: string;
  private readonly secretToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = (
      this.config.get<string>('PYTHON_SERVICE_URL') ||
      'http://127.0.0.1:8001'
    ).replace(/\/$/, '');
    this.secretToken =
      this.config.get<string>('PYTHON_ENGINE_SECRET') ||
      DEFAULT_ENGINE_SECRET;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Engine-Secret': this.secretToken,
      Authorization: `Bearer ${this.secretToken}`,
    };
  }

  /**
   * Submits a video source URL and clipping options to the Python processing
   * engine. Generates the engine-side job id here so the python-service can
   * echo it back; on any transport failure the error is surfaced honestly.
   */
  async submitJob(
    sourceUrl: string,
    options: Record<string, any> = {},
    userId?: string,
  ): Promise<PythonJobSubmitResponse> {
    const jobId = randomUUID();

    const payload = {
      jobId,
      videoId: jobId,
      userId: userId || undefined,
      sourceUrl,
      tier: options.tier || 'free',
      transcriptionProvider: options.transcriptionProvider || undefined,
      settings: {
        aspectRatio: options.aspectRatio || '9:16',
        clipCount: options.clipCount ?? 3,
        targetDuration: options.targetDuration || 'medium',
        contentStyle: options.category || 'podcast',
        captionStyle: options.captionPreset || 'karaoke',
        hookThreshold: sensitivityToThreshold(options.highlightSensitivity),
        autoFaceReframing: options.autoReframe ?? true,
      },
    };

    try {
      this.logger.log(
        `Submitting job ${jobId} to Python service at ${this.baseUrl}/jobs for source: ${sourceUrl}`,
      );
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.baseUrl}/jobs`, payload, {
          headers: this.getHeaders(),
          timeout: 15000,
        }),
      );

      const data = response.data;
      const echoedJobId = data?.jobId || data?.job_id || jobId;
      return { jobId: echoedJobId };
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error communicating with video processing service';

      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND'
      ) {
        this.logger.error(
          `Python service unreachable at ${this.baseUrl} (${err.code}).`,
        );
        throw new ServiceUnavailableException(
          `Video processing service is unreachable at ${this.baseUrl}. ` +
            'The pipeline cannot accept jobs right now — no clip generation happened.',
        );
      }

      this.logger.error(
        `Python service rejected job ${jobId} (HTTP ${status || 'unknown'}): ${message}`,
      );
      throw new BadGatewayException(
        `Video processing service error: ${message}`,
      );
    }
  }

  /**
   * Polls status and progress of a job from the Python service. Failures are
   * surfaced as errors — no synthetic progress is ever returned.
   */
  async getJobStatus(engineJobId: string): Promise<PythonJobStatusResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.baseUrl}/jobs/${engineJobId}`, {
          headers: this.getHeaders(),
          timeout: 8000,
        }),
      );

      const data = response.data;
      const rawStatus = String(data?.status || 'processing').toLowerCase();
      const status =
        rawStatus === 'cancelled' ? 'failed' : (rawStatus as any);

      return {
        status,
        progress:
          typeof data?.progress === 'number'
            ? data.progress
            : typeof data?.progress_percent === 'number'
              ? data.progress_percent
              : 0,
        stage: data?.stage || data?.current_stage || 'processing',
        message: data?.message || undefined,
        error: data?.error || null,
      };
    } catch (err: any) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND'
      ) {
        throw new ServiceUnavailableException(
          `Video processing service is unreachable at ${this.baseUrl}.`,
        );
      }
      const status = err.response?.status;
      const message =
        err.response?.data?.detail || err.response?.data?.message || err.message;
      this.logger.error(
        `Failed to query status for engine job ${engineJobId} (HTTP ${status || 'unknown'}): ${message}`,
      );
      throw new BadGatewayException(
        `Unable to query video processing engine: ${message}`,
      );
    }
  }

  /**
   * Fetches generated clips for a job from the Python service result endpoint.
   * Failures are surfaced as errors — an empty clip list is only returned when
   * the engine honestly reports a completed job with no clips.
   */
  async getJobClips(engineJobId: string): Promise<PythonJobClipItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.baseUrl}/jobs/${engineJobId}/result`, {
          headers: this.getHeaders(),
          timeout: 10000,
        }),
      );

      const data = response.data;
      const list = Array.isArray(data?.clips) ? data.clips : [];

      return list.map((clip: any, idx: number) => ({
        id: clip.id || `clip-${engineJobId}-${idx + 1}`,
        filename:
          clip.outputPath
            ? path.basename(String(clip.outputPath))
            : clip.filename || clip.file_name || `clip_${idx + 1}.mp4`,
        title: clip.title || clip.headline || `Viral Clip #${idx + 1}`,
        duration:
          typeof clip.duration === 'number' ? clip.duration : clip.length_seconds || 0,
        viralityScore:
          typeof clip.score === 'number'
            ? clip.score
            : clip.viralityScore ?? clip.virality_score ?? 0,
        hookSummary: clip.hookSummary || clip.hook_summary || clip.summary || undefined,
        tags: clip.tags || [],
        url: clip.clipUrl || clip.download_url || undefined,
        thumbnailUrl: clip.thumbnailPath || clip.thumbnail_url || undefined,
        aspectRatio: clip.aspectRatio || undefined,
        startTime: typeof clip.startTime === 'number' ? clip.startTime : undefined,
        endTime: typeof clip.endTime === 'number' ? clip.endTime : undefined,
      }));
    } catch (err: any) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND'
      ) {
        throw new ServiceUnavailableException(
          `Video processing service is unreachable at ${this.baseUrl}.`,
        );
      }
      const status = err.response?.status;
      const message =
        err.response?.data?.detail || err.response?.data?.message || err.message;
      this.logger.error(
        `Failed to fetch clips for engine job ${engineJobId} (HTTP ${status || 'unknown'}): ${message}`,
      );
      throw new BadGatewayException(
        `Unable to retrieve generated clips: ${message}`,
      );
    }
  }

  /**
   * Proxies a clip video stream from the Python service with Range support.
   */
  async getClipStream(
    engineJobId: string,
    filename: string,
    rangeHeader?: string,
  ): Promise<{
    stream: Readable;
    status: number;
    headers: Record<string, string>;
  }> {
    const headers: Record<string, string> = {
      'X-Engine-Secret': this.secretToken,
      Authorization: `Bearer ${this.secretToken}`,
    };
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const url = `${this.baseUrl}/jobs/${engineJobId}/clips/${filename}`;
    const response: AxiosResponse<Readable> = await firstValueFrom(
      this.httpService.get(url, {
        headers,
        responseType: 'stream',
        validateStatus: () => true, // allow 200, 206, 404, etc.
        timeout: 30000,
      }),
    );

    const outHeaders: Record<string, string> = {};
    const forwardHeaderNames = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
    ];
    for (const name of forwardHeaderNames) {
      if (response.headers[name]) {
        outHeaders[name] = String(response.headers[name]);
      }
    }

    return {
      stream: response.data,
      status: response.status,
      headers: outHeaders,
    };
  }

  /**
   * Health check for Python service (also validates the shared secret so a
   * wrong secret is caught during boot, not mid-job).
   */
  async checkHealth(): Promise<{
    reachable: boolean;
    url: string;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          headers: this.getHeaders(),
          timeout: 3000,
        }),
      );
      return {
        reachable: true,
        url: this.baseUrl,
        latencyMs: Date.now() - start,
      };
    } catch (innerErr: any) {
      return {
        reachable: false,
        url: this.baseUrl,
        error: innerErr.code || innerErr.message || 'Service unreachable',
      };
    }
  }
}
