import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../domain/IUserRepository';
import { LoginDTO } from './dtos/LoginDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { config } from '../../../config';

interface LoginOutput {
  user: { id: string; email: string; name: string; role: string };
  token: string;
}

export class LoginUseCase implements UseCase<LoginDTO, LoginOutput> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: LoginDTO): Promise<LoginOutput> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry } as jwt.SignOptions
    );

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }
}
