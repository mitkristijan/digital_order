import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: `test${Date.now()}@example.com`,
        phone: `+123456${Date.now()}`,
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(registerDto.email);
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          phone: '+1234567890',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const registerDto = {
        email: `login${Date.now()}@example.com`,
        phone: `+123456${Date.now()}`,
        password: 'Test@123',
        firstName: 'Login',
        lastName: 'Test',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto);

      // Then login
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: registerDto.email,
          password: registerDto.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(registerDto.email);
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
