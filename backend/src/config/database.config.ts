import { registerAs } from '@nestjs/config';

/** Database configuration namespace */
export default registerAs('database', () => ({
  type: process.env.DB_TYPE ?? 'better-sqlite3',
  database: process.env.DB_DATABASE ?? 'db.sqlite',
}));
