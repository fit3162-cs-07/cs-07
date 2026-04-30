import bcrypt from 'bcrypt';
import { IUserRepository } from '../domain/IUserRepository';
import { ChangePasswordDTO } from './dtos/ChangePasswordDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createUserPasswordChangedEvent } from '../domain/events/UserPasswordChangedEvent';

interface ChangePasswordInput extends ChangePasswordDTO {
  userId: string;
}

export class ChangePasswordUseCase implements UseCase<ChangePasswordInput, void> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.userRepo.save(user);
    this.eventBus.publish(createUserPasswordChangedEvent(user, input.userId));
  }
}
