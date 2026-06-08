/**
 * Unit tests for CreateTaskUseCase.
 *
 * Verifies the use case in isolation, using:
 *   - InMemoryTaskRepository: a fast in-memory implementation of the
 *     ITaskRepository port, substituted for the real Mongo adapter.
 *   - mockEventBus: a Jest mock that records publish() calls so we can
 *     assert that a TaskCreated event was emitted.
 *
 * The fact that this test runs without Express, Mongoose, or HTTP plumbing
 * is the proof that the use case is correctly decoupled from Infrastructure.
 */

import { CreateTaskUseCase } from '../../../../src/modules/task/application/CreateTaskUseCase';
import { InMemoryTaskRepository } from '../../../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { IEventBus } from '../../../../src/shared/application/EventBus';

// Stand-in event bus that captures publish() calls instead of dispatching.
const mockEventBus: IEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
};

describe('CreateTaskUseCase', () => {
  it('should create a task and publish an event', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const useCase = new CreateTaskUseCase(taskRepo, mockEventBus);

    const task = await useCase.execute({ title: 'New Task', createdBy: 'admin-id' });

    // The aggregate must have been assigned an id and have kept its title.
    expect(task.id).toBeDefined();
    expect(task.title).toBe('New Task');
    // And a TaskCreated domain event must have been emitted for subscribers.
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TaskCreated' })
    );
  });

  it('should persist task to repository', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const useCase = new CreateTaskUseCase(taskRepo, mockEventBus);

    const task = await useCase.execute({ title: 'Persisted Task', createdBy: 'admin-id' });
    // Reading the task back through the repo proves save() actually wrote it.
    const found = await taskRepo.findById(task.id);

    expect(found).not.toBeNull();
    expect(found?.title).toBe('Persisted Task');
  });
});
