# Clipping Tool — NestJS Backend API

The core backend service for the AI video clipping platform. Manages user authentication, clipping jobs, campaign submissions, tier enforcement, and communication with the Python media processing engine.

## Environment Variables

Copy `.env.example` to `.env` and fill in secrets:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `DATABASE_PATH` | `db.sqlite` | SQLite database file path (canonical; `DB_DATABASE` accepted as fallback) |
| `JWT_SECRET` | - | Secret key for signing user authentication tokens |
| `JWT_EXPIRY` | `24h` | Token expiration duration |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |
| `PYTHON_SERVICE_URL` | `http://127.0.0.1:8001` | Internal URL of the python-service orchestrator |
| `PYTHON_ENGINE_SECRET` | `change-me-secret-token` | Shared secret token between NestJS and Python engine |
| `FREE_TIER_DAILY_JOB_CAP` | `2` | Daily clip creation limit for free users |
| `FREE_TIER_MAX_DURATION_SECONDS` | `600` | Max video duration for free users (10 mins) |
| `PAID_TIER_MAX_DURATION_SECONDS` | `1800` | Max video duration for paid users (30 mins) |

## Database & Migrations

The database uses SQLite via `better-sqlite3` managed through **TypeORM**.

### Development vs Production Schema Management

- **Development (`NODE_ENV !== 'production'`)**: TypeORM `synchronize: true` is enabled to automatically synchronize entity changes to the SQLite database schema without requiring manual migration files during rapid prototyping.
- **Production (`NODE_ENV === 'production'`)**: `synchronize: false` is strictly enforced to prevent destructive schema alterations. Instead, migrations are loaded from `src/migrations/` and executed automatically on startup (`migrationsRun: true`).

### Migration Workflow

1. **Initial Migration**: Defined in `src/migrations/1700000000000-InitialSchema.ts`.
2. **Adding New Migrations**:
   When modifying entity definitions in `src/users/`, `src/jobs/`, or `src/campaigns/`:
   - Create a new migration file in `src/migrations/` implementing `MigrationInterface`.
   - Export and register the migration in `src/data-source.ts` and `src/app.module.ts`.
3. **Running Migrations Manually**:
   ```bash
   npm run build
   npx typeorm migration:run -d dist/data-source.js
   ```

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run unit tests
npm run test
```
