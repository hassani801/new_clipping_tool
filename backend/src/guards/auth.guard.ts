import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Placeholder auth guard — extend this to implement JWT / API-key auth.
 * By default it allows all requests through.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: verify JWT token from Authorization header
    return true;
  }
}
