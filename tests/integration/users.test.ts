import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { User } from '../../src/modules/identity/domain/User';
import { Role } from '../../src/modules/identity/domain/Role';

const userRepo = new InMemoryUserRepository();
const taskRepo = new InMemoryTaskRepository();
const app = createApp(userRepo, taskRepo);

let adminToken = '';
let adminId = '';
let memberToken = '';
let memberId = '';
let otherMemberId = '';

beforeAll(async () => {
  // /auth/register only ever creates MEMBER accounts now (Task F1), so admins
  // are seeded directly into the repo for tests.
  const adminHash = await bcrypt.hash('password123', 10);
  const admin = new User({
    email: 'users-admin@test.com',
    name: 'Users Admin',
    passwordHash: adminHash,
    role: Role.ADMIN,
  });
  await userRepo.save(admin);
  adminId = admin.id;

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

  const otherReg = await request(app).post('/api/v1/auth/register').send({
    email: 'users-other@test.com',
    name: 'Other Member',
    password: 'password123',
  });
  otherMemberId = otherReg.body.data.user.id;
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
    for (const u of res.body.data) {
      expect(u).toHaveProperty('isActive', true);
    }
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

describe('PATCH /api/v1/users/:id (admin)', () => {
  it('rejects member callers with 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${otherMemberId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked Name' });
    expect(res.status).toBe(403);
  });

  it('lets admin promote a member to ADMIN', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${otherMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');

    // Restore for downstream tests
    await request(app)
      .patch(`/api/v1/users/${otherMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER' });
  });

  it('refuses to let an admin change their own role', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE');
  });

  it('returns 404 for unknown user', async () => {
    const res = await request(app)
      .patch('/api/v1/users/does-not-exist')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/users/:id/(de)activate (admin)', () => {
  it('admin deactivates a member, member can no longer log in', async () => {
    const deact = await request(app)
      .post(`/api/v1/users/${memberId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deact.status).toBe(200);
    expect(deact.body.data.isActive).toBe(false);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'users-member@test.com',
      password: 'password123',
    });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('admin reactivates the same member, login succeeds again', async () => {
    const reac = await request(app)
      .post(`/api/v1/users/${memberId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reac.status).toBe(200);
    expect(reac.body.data.isActive).toBe(true);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'users-member@test.com',
      password: 'password123',
    });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeDefined();
  });

  it('refuses to let an admin deactivate themselves', async () => {
    const res = await request(app)
      .post(`/api/v1/users/${adminId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
  });

  it('rejects member callers with 403', async () => {
    const res = await request(app)
      .post(`/api/v1/users/${otherMemberId}/deactivate`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
