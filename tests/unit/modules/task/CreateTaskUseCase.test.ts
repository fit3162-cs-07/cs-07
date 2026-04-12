import { CreateTaskUseCase } from '../../../../src/modules/task/application/CreateTaskUseCase';
import { InMemoryTaskRepository } from '../../../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { IEventBus } from '../../../../src/shared/application/EventBus';

const mockEventBus: IEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
};

describe('CreateTaskUseCase', () => {
  it('should create a task and publish an event', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const useCase = new CreateTaskUseCase(taskRepo, mockEventBus);

    const task = await useCase.execute({ title: 'New Task', createdBy: 'admin-id' });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('New Task');
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TaskCreated' })
    );
  });

  it('should persist task to repository', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const useCase = new CreateTaskUseCase(taskRepo, mockEventBus);

    const task = await useCase.execute({ title: 'Persisted Task', createdBy: 'admin-id' });
    const found = await taskRepo.findById(task.id);

    expect(found).not.toBeNull();
    expect(found?.title).toBe('Persisted Task');
  });
});
