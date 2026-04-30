import { SetUserActiveUseCase } from '../../../../src/modules/identity/application/SetUserActiveUseCase';
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

async function setup() {
  const userRepo = new InMemoryUserRepository();
  const bus = new FakeBus();
  const admin = new User({ email: 'a@x.com', name: 'A', passwordHash: 'h', role: Role.ADMIN });
  const member = new User({ email: 'm@x.com', name: 'M', passwordHash: 'h', role: Role.MEMBER });
  await userRepo.save(admin);
  await userRepo.save(member);
  return { userRepo, bus, admin, member, useCase: new SetUserActiveUseCase(userRepo, bus) };
}

describe('SetUserActiveUseCase', () => {
  it('deactivates an active member and emits UserStatusChanged', async () => {
    const { useCase, bus, admin, member, userRepo } = await setup();
    const result = await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      isActive: false,
    });
    expect(result.isActive).toBe(false);
    expect((await userRepo.findById(member.id))?.isActive).toBe(false);
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('UserStatusChanged');
    expect(bus.events[0]?.payload).toEqual({ isActive: false });
  });

  it('reactivates a deactivated member', async () => {
    const { useCase, admin, member } = await setup();
    member.isActive = false;
    const result = await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      isActive: true,
    });
    expect(result.isActive).toBe(true);
  });

  it('refuses to let an admin deactivate themselves', async () => {
    const { useCase, admin, bus } = await setup();
    await expect(
      useCase.execute({ targetUserId: admin.id, actorId: admin.id, isActive: false }),
    ).rejects.toThrow('CANNOT_DEACTIVATE_SELF');
    expect(bus.events).toHaveLength(0);
  });

  it('lets an admin reactivate themselves (idempotent / harmless)', async () => {
    const { useCase, admin } = await setup();
    const result = await useCase.execute({
      targetUserId: admin.id,
      actorId: admin.id,
      isActive: true,
    });
    expect(result.isActive).toBe(true);
  });

  it('is a no-op when status already matches — no event fired', async () => {
    const { useCase, bus, admin, member } = await setup();
    await useCase.execute({ targetUserId: member.id, actorId: admin.id, isActive: true });
    expect(bus.events).toHaveLength(0);
  });

  it('throws USER_NOT_FOUND for an unknown target', async () => {
    const { useCase, admin } = await setup();
    await expect(
      useCase.execute({ targetUserId: 'missing', actorId: admin.id, isActive: false }),
    ).rejects.toThrow('USER_NOT_FOUND');
  });
});
