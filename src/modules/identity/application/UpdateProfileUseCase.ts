import { User } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { UpdateProfileDTO } from './dtos/UpdateProfileDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createUserProfileUpdatedEvent } from '../domain/events/UserProfileUpdatedEvent';

interface UpdateProfileInput extends UpdateProfileDTO {
  userId: string;
}

export class UpdateProfileUseCase implements UseCase<UpdateProfileInput, User> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    user.name = input.name;
    await this.userRepo.save(user);
    this.eventBus.publish(createUserProfileUpdatedEvent(user, input.userId));

    return user;
  }
}
