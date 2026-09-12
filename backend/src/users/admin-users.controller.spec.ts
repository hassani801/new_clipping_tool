import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller.js';
import { User, UserTier, SubscriptionStatus } from './user.entity.js';

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = 'u-1';
  user.email = 'tester@example.com';
  user.name = null;
  user.passwordHash = 'hash';
  user.tier = UserTier.FREE;
  user.subscriptionStatus = SubscriptionStatus.INACTIVE;
  user.subscriptionExpiresAt = null;
  user.isVerified = false;
  user.isAdmin = false;
  user.createdAt = new Date();
  user.updatedAt = new Date();
  Object.assign(user, overrides);
  return user;
}

describe('AdminUsersController', () => {
  const service: any = {
    findAll: vi.fn().mockResolvedValue([makeUser()]),
    findById: vi.fn().mockResolvedValue(makeUser()),
    updateTier: vi.fn().mockImplementation(
      async (_id: string, tier: UserTier, status: SubscriptionStatus) =>
        makeUser({ tier, subscriptionStatus: status }),
    ),
    sanitizeUser: (user: User) => {
      const { passwordHash: _passwordHash, ...rest } = user;
      return rest;
    },
  };
  const controller = new AdminUsersController(service);

  it('lists all users without password hashes', async () => {
    const users = await controller.listUsers();
    expect(users).toHaveLength(1);
    expect(users[0]).not.toHaveProperty('passwordHash');
    expect(users[0].email).toBe('tester@example.com');
  });

  it('sets a user to paid with an active subscription', async () => {
    const res = await controller.setUserTier('u-1', { tier: UserTier.PAID });
    expect(service.updateTier).toHaveBeenCalledWith(
      'u-1',
      UserTier.PAID,
      SubscriptionStatus.ACTIVE,
      null,
    );
    expect(res.user.tier).toBe(UserTier.PAID);
    expect(res.user.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
  });

  it('sets a user back to free and clears the subscription', async () => {
    const res = await controller.setUserTier('u-1', { tier: UserTier.FREE });
    expect(service.updateTier).toHaveBeenCalledWith(
      'u-1',
      UserTier.FREE,
      SubscriptionStatus.INACTIVE,
      null,
    );
    expect(res.user.tier).toBe(UserTier.FREE);
  });

  it('rejects an unknown user id', async () => {
    service.findById.mockResolvedValueOnce(null);
    await expect(
      controller.setUserTier('nope', { tier: UserTier.PAID }),
    ).rejects.toThrow(NotFoundException);
  });
});
