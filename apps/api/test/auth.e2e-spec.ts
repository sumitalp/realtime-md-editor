import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const validRegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/register')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send(validRegisterDto)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('name', validRegisterDto.name);
      expect(response.body.user).toHaveProperty('email', validRegisterDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should return 400 for invalid registration data', async () => {
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/register')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(400);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/register')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send(validRegisterDto)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(201);

      // Duplicate registration
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/register')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send(validRegisterDto)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register user for login tests
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/register')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send(registerDto);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/login')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send(loginDto)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('email', loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should return 400 for invalid credentials', async () => {
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/login')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(400);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    it('should return 400 for non-existent user', async () => {
      await request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .post('/auth/login')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(400);
    });
  });
});