import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Cookies Middleware (httpOnly JWT handling) ───────────────────────────
  app.use(cookieParser());

  // ── Global Exception Filter (standardized JSON error response) ───────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── CORS (enables credentials for httpOnly cookies) ──────────────────────
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allowed origins
      const allowedOrigins = [
        corsOrigin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.run.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true, // auto-transform payloads to DTO instances
    }),
  );

  // ── Global Prefix ────────────────────────────────────────────────────────
  // Exclude root and /health so health check is directly accessible at GET /health
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health'],
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NestJS Backend running on http://0.0.0.0:${port}/api`);
  console.log(`🩺 Health check available at http://0.0.0.0:${port}/health`);
}

bootstrap();
