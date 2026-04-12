import { Task } from '../../../../src/modules/task/domain/Task';
import { TaskStatus } from '../../../../src/modules/task/domain/TaskStatus';
import { TaskPriority } from '../../../../src/modules/task/domain/TaskPriority';

describe('Task entity', () => {
  const makeTask = () => new Task({ title: 'Test task', createdBy: 'user-1' });

  it('should default to TODO status and MEDIUM priority', () => {
    const task = makeTask();
    expect(task.status).toBe(TaskStatus.TODO);
    expect(task.priority).toBe(TaskPriority.MEDIUM);
  });

  it('should assign a user', () => {
    const task = makeTask();
    task.assign('user-2');
    expect(task.assigneeId).toBe('user-2');
  });

  it('should change status', () => {
    const task = makeTask();
    task.changeStatus(TaskStatus.IN_PROGRESS);
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should update updatedAt when modified', () => {
    const task = makeTask();
    const before = task.updatedAt;
    task.changeStatus(TaskStatus.DONE);
    expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('should update fields with update()', () => {
    const task = makeTask();
    task.update({ title: 'New title', priority: TaskPriority.HIGH });
    expect(task.title).toBe('New title');
    expect(task.priority).toBe(TaskPriority.HIGH);
  });
});
