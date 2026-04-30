import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';

const userRepo = new InMemoryUserRepository();
const taskRepo = new InMemoryTaskRepository();
const app = createApp(userRepo, taskRepo);

async function registerAndLogin(email: string, name: string, password: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, name, password });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token as string;
}

describe('GET /api/v1/users/me', () => {
  it('returns the authenticated user', async () => {
    const token = await registerAndLogin('me@test.com', 'Me', 'password123');
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('me@test.com');
    expect(res.body.data.name).toBe('Me');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/users/me', () => {
  it('updates the user name', async () => {
    const token = await registerAndLogin('rename@test.com', 'Old Name', 'password123');
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
  });

  it('rejects an empty name', async () => {
    const token = await registerAndLogin('rename2@test.com', 'Old', 'password123');
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).patch('/api/v1/users/me').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/users/me/password', () => {
  it('changes the password and lets the user log in with the new one', async () => {
    const token = await registerAndLogin('pw@test.com', 'PW', 'password123');

    const change = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(change.status).toBe(200);

    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pw@test.com', password: 'newpassword456' });
    expect(loginNew.status).toBe(200);

    const loginOld = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pw@test.com', password: 'password123' });
    expect(loginOld.status).toBe(401);
  });

  it('returns 401 when the current password is wrong', async () => {
    const token = await registerAndLogin('pw2@test.com', 'PW2', 'password123');

    const res = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpassword456' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const token = await registerAndLogin('pw3@test.com', 'PW3', 'password123');

    const res = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/password')
      .send({ currentPassword: 'a', newPassword: 'longenough' });
    expect(res.status).toBe(401);
  });
});
