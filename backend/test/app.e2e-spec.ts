import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Video Clipping SaaS Backend (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', {
      exclude: ['/', 'health'],
    });

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET / -> returns root greeting', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /health -> returns health status with database and python service checks', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services.database.status).toBe('connected');
    expect(res.body.services).toHaveProperty('pythonEngine');
  });

  it('Auth Flow: Signup -> Login -> Auth Me -> Create Job -> Get Jobs', async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Signup
    const signupRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    expect(signupRes.body.user).toBeDefined();
    expect(signupRes.body.user.email).toBe(testEmail);
    expect(signupRes.body.user.tier).toBe('free');
    expect(signupRes.body.accessToken).toBeDefined();

    // Check httpOnly cookie is set
    const cookies = signupRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);

    const token = signupRes.body.accessToken;

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();

    // 3. Auth Me
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe(testEmail);
    expect(meRes.body.tier).toBe('free');
    expect(meRes.body.passwordHash).toBeUndefined();

    // 4. Submit Job
    const jobRes = await request(app.getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'podcast',
        clipCount: 2,
        aspectRatio: '9:16',
        autoReframe: true,
        highlightSensitivity: 'balanced',
      })
      .expect(201);

    expect(jobRes.body.jobId).toBeDefined();
    expect(jobRes.body.job.sourceUrl).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(jobRes.body.job.options.tier).toBe('free');
    expect(jobRes.body.job.options.transcriptionProvider).toBe('faster_whisper');

    const createdJobId = jobRes.body.jobId;

    // 5. Get Job by ID
    const singleJobRes = await request(app.getHttpServer())
      .get(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(singleJobRes.body.id).toBe(createdJobId);

    // 6. List User Jobs
    const listRes = await request(app.getHttpServer())
      .get('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body.count).toBeGreaterThanOrEqual(1);
    expect(listRes.body.jobs.some((j: any) => j.id === createdJobId)).toBe(true);

    // 7. Ownership Guard test: another user cannot view this job
    const anotherUserEmail = `other_${Date.now()}@example.com`;
    const otherSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: anotherUserEmail, password: testPassword })
      .expect(201);

    const otherToken = otherSignup.body.accessToken;

    await request(app.getHttpServer())
      .get(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
