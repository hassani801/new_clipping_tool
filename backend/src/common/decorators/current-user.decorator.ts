import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  tier: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
