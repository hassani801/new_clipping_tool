/**
 * One-time admin bootstrap: promote an existing user to admin, or create a new
 * admin user when none exists yet (avoids the chicken-and-egg problem of
 * needing an admin to grant admin).
 *
 * Usage:
 *   npm run create-admin -- --email=you@example.com
 *   npm run create-admin -- --email=you@example.com --password=secret123 --name="Your Name"
 *
 * With an existing user, --password is ignored. For a new user, --password is
 * required so the account can actually log in.
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source.js';
import { User, SubscriptionStatus, UserTier } from '../users/user.entity.js';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) {
    return undefined;
  }
  const value = found.slice(prefix.length).trim();
  return value.length > 0 ? value : undefined;
}

async function main(): Promise<void> {
  const email = (arg('email') || '').trim().toLowerCase();
  if (!email) {
    console.error(
      'Usage: npm run create-admin -- --email=you@example.com [--password=<pw>] [--name="Your Name"]',
    );
    process.exitCode = 1;
    return;
  }

  const password = arg('password');
  const name = arg('name');

  await AppDataSource.initialize();
  try {
    // Apply any pending schema migrations so the script also works against a
    // fresh/empty database (idempotent — the app's own migrationsRun covers
    // the normal case).
    await AppDataSource.runMigrations();

    const repo = AppDataSource.getRepository(User);
    let user = await repo.findOne({ where: { email } });

    if (user) {
      user.isAdmin = true;
      await repo.save(user);
      console.log(
        `Promoted existing user ${user.email} (id=${user.id}) to admin.`,
      );
      return;
    }

    if (!password) {
      console.error(
        `No user with email "${email}" exists. Re-run with --password=<pw> to create it as an admin.`,
      );
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user = repo.create({
      email,
      passwordHash,
      name: name || null,
      tier: UserTier.FREE,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
      isVerified: false,
      isAdmin: true,
    });
    await repo.save(user);
    console.log(
      `Created admin user ${user.email} (id=${user.id}). Log in and open /admin/users.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void main();
