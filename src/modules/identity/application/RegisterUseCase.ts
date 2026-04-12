import bcrypt from 'bcrypt';
import { User } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { RegisterDTO } from './dtos/RegisterDTO';
import { UseCase } from '../../../shared/application/UseCase';

interface RegisterOutput {
  user: { id: string; email: string; name: string; role: string };
}

export class RegisterUseCase implements UseCase<RegisterDTO, RegisterOutput> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: RegisterDTO): Promise<RegisterOutput> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      const err = new Error('EMAIL_TAKEN');
      throw err;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = new User({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role,
    });

    await this.userRepo.save(user);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
