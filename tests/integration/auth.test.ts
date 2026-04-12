import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';

const userRepo = new InMemoryUserRepository();
const taskRepo = new InMemoryTaskRepository();
const app = createApp(userRepo, taskRepo);

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'newuser@test.com',
      name: 'New User',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newuser@test.com');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'dup@test.com',
      name: 'Dup User',
      password: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'dup@test.com',
      name: 'Dup User 2',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      name: 'Bad',
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@test.com',
      name: 'Login User',
      password: 'password123',
    });
  });

  it('should return token for valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@test.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
  });
});
