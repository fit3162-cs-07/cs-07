import { IUserRepository } from '../domain/IUserRepository';
import { Role } from '../domain/Role';
import { UseCase } from '../../../shared/application/UseCase';
import { UserSummaryDTO } from './dtos/UserSummaryDTO';

export interface GetUsersInput {
  actorId: string;
  actorRole: Role;
}

export class GetUsersUseCase implements UseCase<GetUsersInput, UserSummaryDTO[]> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: GetUsersInput): Promise<UserSummaryDTO[]> {
    if (input.actorRole === Role.ADMIN) {
      const users = await this.userRepo.findAll();
      return users.map(toSummary);
    }

    const self = await this.userRepo.findById(input.actorId);
    return self ? [toSummary(self)] : [];
  }
}

function toSummary(user: { id: string; name: string; email: string; role: Role }): UserSummaryDTO {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
