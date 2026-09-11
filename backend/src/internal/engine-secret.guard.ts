import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_ENGINE_SECRET = 'change-me-secret-token';

/**
 * EngineSecretGuard — validates the shared secret (X-Engine-Secret or
 * Authorization: Bearer) used by the python-service when calling internal
 * endpoints (job-result callback). Must match PYTHON_ENGINE_SECRET on both
 * sides.
 */
@Injectable()
export class EngineSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected =
      this.config.get<string>('PYTHON_ENGINE_SECRET') ||
      DEFAULT_ENGINE_SECRET;

    const provided =
      request.headers['x-engine-secret'] ||
      (typeof request.headers['authorization'] === 'string' &&
      request.headers['authorization'].startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : '');

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing engine secret');
    }
    return true;
  }
}
