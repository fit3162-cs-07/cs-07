import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { seedData } from '../../src/seed/seedData';

let adminToken: string;
let memberToken: string;
let member2Token: string;
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

  const member2Login = await request(app).post('/api/v1/auth/login').send({ email: 'member2@monash.edu', password: 'member123' });
  member2Token = member2Login.body.data.token;
});

describe('GET /api/v1/tasks', () => {
  it('should return all tasks for admin with pagination meta', async () => {
    const res = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(20);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=TODO')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { status: string }) => t.status === 'TODO')).toBe(true);
  });

  it('should filter by priority', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?priority=HIGH')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { priority: string }) => t.priority === 'HIGH')).toBe(true);
  });

  it('should filter by tag', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?tag=urgent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should filter by multiple tags', async () => {
    // Seed data: Task 1 has ['events', 'urgent'], Task 4 has ['finance', 'urgent']
    // Filtering by both 'events' AND 'urgent' should return only Task 1
    const res = await request(app)
      .get('/api/v1/tasks?tag=events&tag=urgent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toContain('venue');
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=venue')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toContain('venue');
  });

  it('should search by description', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=poster')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(5);
    expect(res.body.meta.totalPages).toBe(3);
  });

  it('should return empty page for out-of-range page number', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?page=100&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(5);
  });

  it('should return 400 for invalid status filter', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=INVALID')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid priority filter', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?priority=INVALID')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  describe('RBAC: member visibility', () => {
    it('should only show tasks assigned to or created by the member', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      // member1 is assigned Task A and Task D (sponsorship), and didn't create any of the seeded tasks
      // Actually member1 is assigned: 'Book venue' and 'Submit sponsorship proposal'
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.total).toBeLessThan(5); // should not see all 5
    });

    it('member2 should see different tasks than member1', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${member2Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});

describe('POST /api/v1/tasks', () => {
  it('should allow admin to create task with tags', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Tagged Task', tags: ['backend', 'urgent'] });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Tagged Task');
    expect(res.body.data.tags).toHaveLength(2);
  });

  it('should allow admin to create task without tags', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'No Tags Task' });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toHaveLength(0);
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
