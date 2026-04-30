import { User } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { UpdateUserDTO } from './dtos/UpdateUserDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createUserProfileUpdatedEvent } from '../domain/events/UserProfileUpdatedEvent';
import { createUserRoleChangedEvent } from '../domain/events/UserRoleChangedEvent';

export interface UpdateUserInput extends UpdateUserDTO {
  targetUserId: string;
  actorId: string;
}

export class UpdateUserUseCase implements UseCase<UpdateUserInput, User> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const user = await this.userRepo.findById(input.targetUserId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (input.role !== undefined && input.role !== user.role && input.targetUserId === input.actorId) {
      // An admin demoting themselves can lock the workspace out of admin
      // capabilities entirely; block it here so a UI mistake is recoverable.
      throw new Error('CANNOT_CHANGE_OWN_ROLE');
    }

    const previousRole = user.role;
    let nameChanged = false;
    let roleChanged = false;

    if (input.name !== undefined && input.name !== user.name) {
      user.name = input.name;
      nameChanged = true;
    }
    if (input.role !== undefined && input.role !== user.role) {
      user.role = input.role;
      roleChanged = true;
    }

    if (!nameChanged && !roleChanged) {
      return user;
    }

    await this.userRepo.save(user);

    if (nameChanged) {
      this.eventBus.publish(createUserProfileUpdatedEvent(user, input.actorId));
    }
    if (roleChanged) {
      this.eventBus.publish(
        createUserRoleChangedEvent({
          userId: user.id,
          previousRole,
          newRole: user.role,
          actor: input.actorId,
        }),
      );
    }

    return user;
  }
}
