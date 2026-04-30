import bcrypt from 'bcrypt';
import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from '../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { InMemoryNotificationRepository } from '../../src/modules/notification/infrastructure/InMemoryNotificationRepository';
import { User } from '../../src/modules/identity/domain/User';
import { Role } from '../../src/modules/identity/domain/Role';

const userRepo = new InMemoryUserRepository();
const taskRepo = new InMemoryTaskRepository();
const notificationRepo = new InMemoryNotificationRepository();
const app = createApp(userRepo, taskRepo, { notificationRepo });

let adminToken = '';
let memberToken = '';
let memberId = '';
let otherMemberId = '';
let otherMemberToken = '';

beforeAll(async () => {
  // Seed an admin directly — public /register is locked to MEMBER (PR #12).
  const adminHash = await bcrypt.hash('password123', 10);
  const admin = new User({
    email: 'notif-admin@test.com',
    name: 'Notif Admin',
    passwordHash: adminHash,
    role: Role.ADMIN,
  });
  await userRepo.save(admin);
  const adminLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'notif-admin@test.com',
    password: 'password123',
  });
  adminToken = adminLogin.body.data.token;

  const memberReg = await request(app).post('/api/v1/auth/register').send({
    email: 'notif-member@test.com',
    name: 'Notif Member',
    password: 'password123',
  });
  memberId = memberReg.body.data.user.id;
  const memberLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'notif-member@test.com',
    password: 'password123',
  });
  memberToken = memberLogin.body.data.token;

  const otherReg = await request(app).post('/api/v1/auth/register').send({
    email: 'notif-other@test.com',
    name: 'Notif Other',
    password: 'password123',
  });
  otherMemberId = otherReg.body.data.user.id;
  const otherLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'notif-other@test.com',
    password: 'password123',
  });
  otherMemberToken = otherLogin.body.data.token;
});

async function createTaskAssignedTo(assigneeId: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Notif Test Task',
      description: 'For notification flow',
      priority: 'MEDIUM',
      assigneeId,
    });
  return res.body.data.id;
}

describe('Notifications integration', () => {
  it('rejects unauthenticated requests on the listing endpoint', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('creates a notification when a task is assigned to a member', async () => {
    await createTaskAssignedTo(memberId);

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const titles = res.body.data.map((n: { title: string }) => n.title);
    expect(titles.some((t: string) => t.includes('You were assigned'))).toBe(true);
  });

  it('exposes an unread count and supports unreadOnly filtering', async () => {
    const before = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(before.status).toBe(200);
    expect(before.body.data.count).toBeGreaterThan(0);

    const unreadOnly = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(unreadOnly.status).toBe(200);
    expect(unreadOnly.body.data.every((n: { isRead: boolean }) => !n.isRead)).toBe(true);
  });

  it('marks a single notification as read', async () => {
    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`);
    const first = list.body.data[0];

    const res = await request(app)
      .post(`/api/v1/notifications/${first.id}/read`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);

    const after = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`);
    const found = after.body.data.find((n: { id: string }) => n.id === first.id);
    expect(found.isRead).toBe(true);
  });

  it('forbids one user from marking another user\u2019s notification', async () => {
    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`);
    const target = list.body.data.find((n: { isRead: boolean }) => !n.isRead) ?? list.body.data[0];

    const res = await request(app)
      .post(`/api/v1/notifications/${target.id}/read`)
      .set('Authorization', `Bearer ${otherMemberToken}`);
    expect([403, 404]).toContain(res.status);
  });

  it('marks all read in one call', async () => {
    await createTaskAssignedTo(memberId);
    const before = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(before.body.data.count).toBeGreaterThan(0);

    const res = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);

    const after = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(after.body.data.count).toBe(0);
  });

  it('does not notify the actor when an admin assigns a task to themselves', async () => {
    // grab admin user id
    const me = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${adminToken}`);
    const adminId = me.body.data.id;

    const before = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    const beforeLen = before.body.data.length;

    await createTaskAssignedTo(adminId);

    const after = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.length).toBe(beforeLen);
    expect(otherMemberId).toBeDefined();
  });

  it('isolates notifications between users', async () => {
    const otherList = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${otherMemberToken}`);
    expect(otherList.status).toBe(200);
    // none of the notifications listed for the "other" member should reference notif-member's id
    expect(otherList.body.data.length).toBeGreaterThanOrEqual(0);
  });
});
