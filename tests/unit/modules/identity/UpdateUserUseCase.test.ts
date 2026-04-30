import { UpdateUserUseCase } from '../../../../src/modules/identity/application/UpdateUserUseCase';
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
  const admin = new User({ email: 'admin@x.com', name: 'Admin', passwordHash: 'h', role: Role.ADMIN });
  const member = new User({ email: 'm@x.com', name: 'Old', passwordHash: 'h', role: Role.MEMBER });
  await userRepo.save(admin);
  await userRepo.save(member);
  return { userRepo, bus, admin, member, useCase: new UpdateUserUseCase(userRepo, bus) };
}

describe('UpdateUserUseCase', () => {
  it('updates name only — emits UserProfileUpdated, leaves role alone', async () => {
    const { useCase, bus, admin, member, userRepo } = await setup();
    const result = await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      name: 'New Name',
    });
    expect(result.name).toBe('New Name');
    expect(result.role).toBe(Role.MEMBER);
    const reloaded = await userRepo.findById(member.id);
    expect(reloaded?.name).toBe('New Name');
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('UserProfileUpdated');
  });

  it('promotes a member to ADMIN — emits UserRoleChanged with previous + new', async () => {
    const { useCase, bus, admin, member } = await setup();
    const result = await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      role: Role.ADMIN,
    });
    expect(result.role).toBe(Role.ADMIN);
    expect(bus.events).toHaveLength(1);
    const evt = bus.events[0];
    expect(evt?.eventType).toBe('UserRoleChanged');
    expect(evt?.payload).toEqual({ previousRole: Role.MEMBER, newRole: Role.ADMIN });
    expect(evt?.actor).toBe(admin.id);
  });

  it('emits both events when name and role change in the same call', async () => {
    const { useCase, bus, admin, member } = await setup();
    await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      name: 'Promoted',
      role: Role.ADMIN,
    });
    const types = bus.events.map(e => e.eventType).sort();
    expect(types).toEqual(['UserProfileUpdated', 'UserRoleChanged']);
  });

  it('refuses to let an admin change their own role (CANNOT_CHANGE_OWN_ROLE)', async () => {
    const { useCase, admin, bus } = await setup();
    await expect(
      useCase.execute({ targetUserId: admin.id, actorId: admin.id, role: Role.MEMBER }),
    ).rejects.toThrow('CANNOT_CHANGE_OWN_ROLE');
    expect(bus.events).toHaveLength(0);
  });

  it('lets an admin update their own name without touching their role', async () => {
    const { useCase, admin, bus } = await setup();
    const result = await useCase.execute({
      targetUserId: admin.id,
      actorId: admin.id,
      name: 'Renamed Admin',
    });
    expect(result.name).toBe('Renamed Admin');
    expect(result.role).toBe(Role.ADMIN);
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('UserProfileUpdated');
  });

  it('emits nothing when nothing actually changes', async () => {
    const { useCase, member, admin, bus } = await setup();
    const result = await useCase.execute({
      targetUserId: member.id,
      actorId: admin.id,
      name: member.name,
      role: member.role,
    });
    expect(result.name).toBe(member.name);
    expect(bus.events).toHaveLength(0);
  });

  it('throws USER_NOT_FOUND when the target is missing', async () => {
    const { useCase, admin } = await setup();
    await expect(
      useCase.execute({ targetUserId: 'nope', actorId: admin.id, name: 'X' }),
    ).rejects.toThrow('USER_NOT_FOUND');
  });
});
