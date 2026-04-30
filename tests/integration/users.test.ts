import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';

const userRepo = new InMemoryUserRepository();
const taskRepo = new InMemoryTaskRepository();
const app = createApp(userRepo, taskRepo);

let adminToken = '';
let memberToken = '';
let memberId = '';

beforeAll(async () => {
  await request(app).post('/api/v1/auth/register').send({
    email: 'users-admin@test.com',
    name: 'Users Admin',
    password: 'password123',
    role: 'ADMIN',
  });
  const adminLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'users-admin@test.com',
    password: 'password123',
  });
  adminToken = adminLogin.body.data.token;

  const memberReg = await request(app).post('/api/v1/auth/register').send({
    email: 'users-member@test.com',
    name: 'Users Member',
    password: 'password123',
  });
  memberId = memberReg.body.data.user.id;
  const memberLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'users-member@test.com',
    password: 'password123',
  });
  memberToken = memberLogin.body.data.token;

  await request(app).post('/api/v1/auth/register').send({
    email: 'users-other@test.com',
    name: 'Other Member',
    password: 'password123',
  });
});

describe('GET /api/v1/users', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('returns all users for admin caller', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const emails = res.body.data.map((u: { email: string }) => u.email);
    expect(emails).toEqual(
      expect.arrayContaining(['users-admin@test.com', 'users-member@test.com', 'users-other@test.com']),
    );
  });

  it('returns only the caller for member', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(memberId);
    expect(res.body.data[0].email).toBe('users-member@test.com');
  });

  it('never exposes passwordHash', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    for (const u of res.body.data) {
      expect(u).not.toHaveProperty('passwordHash');
    }
  });
});
