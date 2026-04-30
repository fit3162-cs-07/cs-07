import { GetUsersUseCase } from '../../../../src/modules/identity/application/GetUsersUseCase';
import { InMemoryUserRepository } from '../../../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { User } from '../../../../src/modules/identity/domain/User';
import { Role } from '../../../../src/modules/identity/domain/Role';

describe('GetUsersUseCase', () => {
  const seedRepo = async () => {
    const repo = new InMemoryUserRepository();
    const admin = new User({ email: 'a@a.com', name: 'Admin', passwordHash: 'x', role: Role.ADMIN });
    const m1 = new User({ email: 'm1@a.com', name: 'Member 1', passwordHash: 'x', role: Role.MEMBER });
    const m2 = new User({ email: 'm2@a.com', name: 'Member 2', passwordHash: 'x', role: Role.MEMBER });
    await repo.save(admin);
    await repo.save(m1);
    await repo.save(m2);
    return { repo, admin, m1, m2 };
  };

  it('returns all users for an admin', async () => {
    const { repo, admin } = await seedRepo();
    const useCase = new GetUsersUseCase(repo);

    const result = await useCase.execute({ actorId: admin.id, actorRole: Role.ADMIN });

    expect(result).toHaveLength(3);
    expect(result.map(u => u.email).sort()).toEqual(['a@a.com', 'm1@a.com', 'm2@a.com']);
  });

  it('returns only the caller for a member', async () => {
    const { repo, m1 } = await seedRepo();
    const useCase = new GetUsersUseCase(repo);

    const result = await useCase.execute({ actorId: m1.id, actorRole: Role.MEMBER });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(m1.id);
    expect(result[0].email).toBe('m1@a.com');
  });

  it('returns empty array when a member references an unknown id', async () => {
    const { repo } = await seedRepo();
    const useCase = new GetUsersUseCase(repo);

    const result = await useCase.execute({ actorId: 'no-such-user', actorRole: Role.MEMBER });

    expect(result).toEqual([]);
  });

  it('does not include passwordHash in any returned summary', async () => {
    const { repo, admin } = await seedRepo();
    const useCase = new GetUsersUseCase(repo);

    const result = await useCase.execute({ actorId: admin.id, actorRole: Role.ADMIN });

    for (const summary of result) {
      expect(summary).not.toHaveProperty('passwordHash');
    }
  });
});
