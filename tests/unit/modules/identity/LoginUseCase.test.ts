import bcrypt from 'bcrypt';
import { LoginUseCase } from '../../../../src/modules/identity/application/LoginUseCase';
import { InMemoryUserRepository } from '../../../../src/modules/identity/infrastructure/InMemoryUserRepository';
import { User } from '../../../../src/modules/identity/domain/User';
import { Role } from '../../../../src/modules/identity/domain/Role';

describe('LoginUseCase', () => {
  it('should return a token for valid credentials', async () => {
    const userRepo = new InMemoryUserRepository();
    const hash = await bcrypt.hash('password123', 10);
    await userRepo.save(new User({ email: 'test@test.com', name: 'Test', passwordHash: hash, role: Role.MEMBER }));

    const useCase = new LoginUseCase(userRepo);
    const result = await useCase.execute({ email: 'test@test.com', password: 'password123' });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  it('should throw INVALID_CREDENTIALS for wrong password', async () => {
    const userRepo = new InMemoryUserRepository();
    const hash = await bcrypt.hash('password123', 10);
    await userRepo.save(new User({ email: 'test@test.com', name: 'Test', passwordHash: hash, role: Role.MEMBER }));

    const useCase = new LoginUseCase(userRepo);
    await expect(useCase.execute({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('should throw INVALID_CREDENTIALS for unknown email', async () => {
    const userRepo = new InMemoryUserRepository();
    const useCase = new LoginUseCase(userRepo);
    await expect(useCase.execute({ email: 'nobody@test.com', password: 'any' })).rejects.toThrow('INVALID_CREDENTIALS');
  });
});
