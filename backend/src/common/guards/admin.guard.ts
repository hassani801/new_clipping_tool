import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../../users/user.entity.js';

/**
 * AdminGuard — assumes JwtAuthGuard already ran and attached the authenticated
 * User entity to the request. Rejects any request whose user is not an admin.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user || !user.isAdmin) {
      throw new ForbiddenException(
        'Admin access required. This endpoint is restricted to administrators.',
      );
    }

    return true;
  }
}
