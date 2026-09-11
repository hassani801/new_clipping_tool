import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { User, UserTier, SubscriptionStatus } from '../users/user.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      sanitizeUser: vi.fn((user: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...rest } = user;
        return rest;
      }),
    };
    jwtService = {
      sign: vi.fn().mockReturnValue('mocked.jwt.token'),
    };
    authService = new AuthService(
      usersService as UsersService,
      jwtService as JwtService,
    );
  });

  it('should throw ConflictException if user already exists on signup', async () => {
    (usersService.findByEmail as any).mockResolvedValue({ id: '1', email: 'test@example.com' });

    await expect(
      authService.signup({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should successfully signup and return user and token', async () => {
    (usersService.findByEmail as any).mockResolvedValue(null);
    const mockCreatedUser: User = {
      id: 'uuid-1',
      email: 'new@example.com',
      passwordHash: 'hashed',
      tier: UserTier.FREE,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
      subscriptionExpiresAt: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobs: [],
    };
    (usersService.create as any).mockResolvedValue(mockCreatedUser);

    const result = await authService.signup({
      email: 'new@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('mocked.jwt.token');
    expect(result.user.email).toBe('new@example.com');
    expect(result.user.tier).toBe('free');
  });

  it('should throw UnauthorizedException on invalid credentials during login', async () => {
    (usersService.findByEmail as any).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'unknown@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should successfully login when credentials match', async () => {
    const rawPass = 'password123';
    const hash = await bcrypt.hash(rawPass, 10);
    const mockUser: User = {
      id: 'uuid-2',
      email: 'user@example.com',
      passwordHash: hash,
      tier: UserTier.PAID,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobs: [],
    };
    (usersService.findByEmail as any).mockResolvedValue(mockUser);

    const result = await authService.login({
      email: 'user@example.com',
      password: rawPass,
    });

    expect(result.accessToken).toBe('mocked.jwt.token');
    expect(result.user.email).toBe('user@example.com');
  });
});
