import { TaskFilter } from '../../../../src/modules/task/domain/TaskFilter';
import { TaskStatus } from '../../../../src/modules/task/domain/TaskStatus';
import { TaskPriority } from '../../../../src/modules/task/domain/TaskPriority';

describe('TaskFilter value object', () => {
  it('should create an empty filter', () => {
    const filter = TaskFilter.create({});
    expect(filter.isEmpty).toBe(true);
  });

  it('should create a filter with all fields', () => {
    const filter = TaskFilter.create({
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeId: 'user-1',
      tags: ['urgent'],
      search: 'Venue',
      dueBefore: new Date('2026-06-01'),
      dueAfter: new Date('2026-01-01'),
    });
    expect(filter.isEmpty).toBe(false);
    expect(filter.status).toBe(TaskStatus.TODO);
    expect(filter.priority).toBe(TaskPriority.HIGH);
    expect(filter.assigneeId).toBe('user-1');
    expect(filter.tags).toEqual(['urgent']);
    expect(filter.search).toBe('venue'); // normalized to lowercase
    expect(filter.dueBefore).toEqual(new Date('2026-06-01'));
    expect(filter.dueAfter).toEqual(new Date('2026-01-01'));
  });

  it('should reject dueBefore earlier than dueAfter', () => {
    expect(() =>
      TaskFilter.create({
        dueBefore: new Date('2026-01-01'),
        dueAfter: new Date('2026-06-01'),
      }),
    ).toThrow('VALIDATION_ERROR');
  });

  it('should allow dueBefore equal to dueAfter', () => {
    const date = new Date('2026-03-15');
    const filter = TaskFilter.create({ dueBefore: date, dueAfter: date });
    expect(filter.dueBefore).toEqual(date);
    expect(filter.dueAfter).toEqual(date);
  });

  it('should trim and lowercase search term', () => {
    const filter = TaskFilter.create({ search: '  Hello World  ' });
    expect(filter.search).toBe('hello world');
  });

  it('should default tags to empty array', () => {
    const filter = TaskFilter.create({});
    expect(filter.tags).toEqual([]);
  });
});
