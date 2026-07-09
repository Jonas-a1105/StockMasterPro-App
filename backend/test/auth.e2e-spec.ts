import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/login (POST) - should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'wrong@email.com', password: 'wrong' })
      .expect(401);
  });

  it('/api/auth/register (POST) - should validate required fields', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: '' })
      .expect(400);
  });
});

describe('Events (e2e)', () => {
  let app: INestApplication;
  let createdId: string;
  const testEvent = {
    title: 'Test Event',
    startDate: new Date().toISOString(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/events (GET) - should return 401 without token', () => {
    return request(app.getHttpServer()).get('/api/events').expect(401);
  });

  it('/api/admin/tenants (GET) - should return 401 without token', () => {
    return request(app.getHttpServer()).get('/api/admin/tenants').expect(401);
  });
});
