import { GetTasksUseCase } from '../../../../src/modules/task/application/GetTasksUseCase';
import { InMemoryTaskRepository } from '../../../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { Task } from '../../../../src/modules/task/domain/Task';
import { TaskStatus } from '../../../../src/modules/task/domain/TaskStatus';
import { TaskPriority } from '../../../../src/modules/task/domain/TaskPriority';
import { Role } from '../../../../src/modules/identity/domain/Role';

describe('GetTasksUseCase', () => {
  let repo: InMemoryTaskRepository;
  let useCase: GetTasksUseCase;
  const adminId = 'admin-1';
  const memberId = 'member-1';
  const otherMemberId = 'member-2';

  beforeEach(async () => {
    repo = new InMemoryTaskRepository();
    useCase = new GetTasksUseCase(repo);

    await repo.save(new Task({ title: 'Task A', status: TaskStatus.TODO, priority: TaskPriority.HIGH, createdBy: adminId, assigneeId: memberId, tags: ['urgent', 'backend'] }));
    await repo.save(new Task({ title: 'Task B', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, createdBy: adminId, assigneeId: otherMemberId, tags: ['frontend'] }));
    await repo.save(new Task({ title: 'Task C', description: 'Search target here', status: TaskStatus.DONE, priority: TaskPriority.LOW, createdBy: memberId, tags: ['backend'] }));
    await repo.save(new Task({ title: 'Task D', status: TaskStatus.TODO, priority: TaskPriority.HIGH, createdBy: adminId, dueDate: new Date('2026-05-01'), tags: ['events', 'urgent'] }));
    await repo.save(new Task({ title: 'Task E', status: TaskStatus.TODO, priority: TaskPriority.LOW, createdBy: adminId, dueDate: new Date('2026-03-01') }));
  });

  describe('admin access', () => {
    it('should return all tasks for admin', async () => {
      const result = await useCase.execute({ userId: adminId, userRole: Role.ADMIN });
      expect(result.total).toBe(5);
      expect(result.tasks).toHaveLength(5);
    });

    it('should filter by status', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { status: TaskStatus.TODO },
      });
      expect(result.tasks.every(t => t.status === TaskStatus.TODO)).toBe(true);
      expect(result.total).toBe(3);
    });

    it('should filter by priority', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { priority: TaskPriority.HIGH },
      });
      expect(result.tasks.every(t => t.priority === TaskPriority.HIGH)).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should filter by tags (all must match)', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { tags: ['urgent', 'backend'] },
      });
      expect(result.total).toBe(1);
      expect(result.tasks[0].title).toBe('Task A');
    });

    it('should search title and description', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { search: 'search target' },
      });
      expect(result.total).toBe(1);
      expect(result.tasks[0].title).toBe('Task C');
    });

    it('should filter by dueBefore', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { dueBefore: new Date('2026-04-01') },
      });
      expect(result.total).toBe(1);
      expect(result.tasks[0].title).toBe('Task E');
    });

    it('should filter by dueAfter', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        filter: { dueAfter: new Date('2026-04-01') },
      });
      expect(result.total).toBe(1);
      expect(result.tasks[0].title).toBe('Task D');
    });
  });

  describe('pagination', () => {
    it('should default to page 1 with limit 20', async () => {
      const result = await useCase.execute({ userId: adminId, userRole: Role.ADMIN });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should paginate correctly', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        page: 1,
        limit: 2,
      });
      expect(result.tasks).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty page when page exceeds total', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        page: 10,
        limit: 2,
      });
      expect(result.tasks).toHaveLength(0);
      expect(result.total).toBe(5);
    });

    it('should clamp limit to max 100', async () => {
      const result = await useCase.execute({
        userId: adminId,
        userRole: Role.ADMIN,
        limit: 500,
      });
      expect(result.limit).toBe(100);
    });
  });

  describe('member RBAC', () => {
    it('should only return tasks created by or assigned to the member', async () => {
      const result = await useCase.execute({ userId: memberId, userRole: Role.MEMBER });
      // Task A (assigned to member), Task C (created by member)
      expect(result.total).toBe(2);
      expect(result.tasks.every(t => t.createdBy === memberId || t.assigneeId === memberId)).toBe(true);
    });

    it('should apply filters on top of RBAC', async () => {
      const result = await useCase.execute({
        userId: memberId,
        userRole: Role.MEMBER,
        filter: { status: TaskStatus.TODO },
      });
      // Only Task A (TODO, assigned to member)
      expect(result.total).toBe(1);
      expect(result.tasks[0].title).toBe('Task A');
    });
  });
});
