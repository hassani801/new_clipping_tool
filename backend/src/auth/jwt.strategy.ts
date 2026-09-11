import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/user.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  tier?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Extract from httpOnly cookie 'access_token'
        (req: Request) => {
          if (req && req.cookies && req.cookies.access_token) {
            return req.cookies.access_token;
          }
          return null;
        },
        // 2. Fallback to Authorization: Bearer <token>
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ||
        'super-secret-jwt-key-for-video-clipping-app',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }
    return user;
  }
}
