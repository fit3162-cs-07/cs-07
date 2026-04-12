import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { seedData } from '../../src/seed/seedData';

let adminToken: string;
let memberToken: string;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  const userRepo = new InMemoryUserRepository();
  const taskRepo = new InMemoryTaskRepository();
  await seedData(userRepo, taskRepo);
  app = createApp(userRepo, taskRepo);

  const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@monash.edu', password: 'admin123' });
  adminToken = adminLogin.body.data.token;

  const memberLogin = await request(app).post('/api/v1/auth/login').send({ email: 'member1@monash.edu', password: 'member123' });
  memberToken = memberLogin.body.data.token;
});

describe('GET /api/v1/tasks', () => {
  it('should return all tasks for authenticated user', async () => {
    const res = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/tasks', () => {
  it('should allow admin to create task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'New Integration Test Task' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New Integration Test Task');
  });

  it('should return 403 when non-admin tries to create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Unauthorized Task' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('should allow admin to delete a task', async () => {
    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'To Be Deleted' });

    const id = create.body.data.id;
    const res = await request(app).delete(`/api/v1/tasks/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});
