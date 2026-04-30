import { UpdateProfileUseCase } from '../../../../src/modules/identity/application/UpdateProfileUseCase';
import { InMemoryUserRepository } from '../../../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { User } from '../../../../src/modules/identity/domain/User';
import { Role } from '../../../../src/modules/identity/domain/Role';
import { DomainEvent } from '../../../../src/shared/domain/DomainEvent';
import { IEventBus } from '../../../../src/shared/application/EventBus';

class FakeBus implements IEventBus {
  events: DomainEvent[] = [];
  publish(event: DomainEvent): void {
    this.events.push(event);
  }
  subscribe(): void {
    // no-op
  }
}

describe('UpdateProfileUseCase', () => {
  it('updates the name and publishes UserProfileUpdated', async () => {
    const userRepo = new InMemoryUserRepository();
    const bus = new FakeBus();
    const user = new User({ email: 'a@a.com', name: 'Old', passwordHash: 'h', role: Role.MEMBER });
    await userRepo.save(user);

    const useCase = new UpdateProfileUseCase(userRepo, bus);
    const result = await useCase.execute({ userId: user.id, name: 'New' });

    expect(result.name).toBe('New');
    const reloaded = await userRepo.findById(user.id);
    expect(reloaded?.name).toBe('New');
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('UserProfileUpdated');
    expect(bus.events[0]?.aggregateId).toBe(user.id);
  });

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    const userRepo = new InMemoryUserRepository();
    const bus = new FakeBus();
    const useCase = new UpdateProfileUseCase(userRepo, bus);

    await expect(useCase.execute({ userId: 'missing', name: 'X' })).rejects.toThrow('USER_NOT_FOUND');
    expect(bus.events).toHaveLength(0);
  });
});
