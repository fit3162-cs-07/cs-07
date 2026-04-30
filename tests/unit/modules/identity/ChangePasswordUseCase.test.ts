import bcrypt from 'bcrypt';
import { ChangePasswordUseCase } from '../../../../src/modules/identity/application/ChangePasswordUseCase';
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

describe('ChangePasswordUseCase', () => {
  it('rotates the password hash and publishes UserPasswordChanged', async () => {
    const userRepo = new InMemoryUserRepository();
    const bus = new FakeBus();
    const oldHash = await bcrypt.hash('oldpassword', 10);
    const user = new User({ email: 'a@a.com', name: 'A', passwordHash: oldHash, role: Role.MEMBER });
    await userRepo.save(user);

    const useCase = new ChangePasswordUseCase(userRepo, bus);
    await useCase.execute({ userId: user.id, currentPassword: 'oldpassword', newPassword: 'newpassword1' });

    const reloaded = await userRepo.findById(user.id);
    expect(await bcrypt.compare('newpassword1', reloaded!.passwordHash)).toBe(true);
    expect(await bcrypt.compare('oldpassword', reloaded!.passwordHash)).toBe(false);
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('UserPasswordChanged');
  });

  it('throws INVALID_CURRENT_PASSWORD when current password is wrong', async () => {
    const userRepo = new InMemoryUserRepository();
    const bus = new FakeBus();
    const hash = await bcrypt.hash('correct', 10);
    const user = new User({ email: 'a@a.com', name: 'A', passwordHash: hash, role: Role.MEMBER });
    await userRepo.save(user);

    const useCase = new ChangePasswordUseCase(userRepo, bus);

    await expect(
      useCase.execute({ userId: user.id, currentPassword: 'wrong', newPassword: 'newpassword1' }),
    ).rejects.toThrow('INVALID_CURRENT_PASSWORD');
    expect(bus.events).toHaveLength(0);

    const reloaded = await userRepo.findById(user.id);
    expect(reloaded!.passwordHash).toBe(hash);
  });

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    const userRepo = new InMemoryUserRepository();
    const bus = new FakeBus();
    const useCase = new ChangePasswordUseCase(userRepo, bus);

    await expect(
      useCase.execute({ userId: 'missing', currentPassword: 'a', newPassword: 'longenough' }),
    ).rejects.toThrow('USER_NOT_FOUND');
  });
});
