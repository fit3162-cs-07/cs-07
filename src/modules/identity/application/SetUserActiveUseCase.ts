import { User } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createUserStatusChangedEvent } from '../domain/events/UserStatusChangedEvent';

export interface SetUserActiveInput {
  targetUserId: string;
  actorId: string;
  isActive: boolean;
}

export class SetUserActiveUseCase implements UseCase<SetUserActiveInput, User> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: SetUserActiveInput): Promise<User> {
    if (!input.isActive && input.targetUserId === input.actorId) {
      // Self-lockout would also drop the only remaining admin in some
      // workspaces; keep the rule simple — never let an admin disable
      // themselves from this endpoint.
      throw new Error('CANNOT_DEACTIVATE_SELF');
    }

    const user = await this.userRepo.findById(input.targetUserId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.isActive === input.isActive) {
      return user;
    }

    user.isActive = input.isActive;
    await this.userRepo.save(user);
    this.eventBus.publish(
      createUserStatusChangedEvent({
        userId: user.id,
        isActive: user.isActive,
        actor: input.actorId,
      }),
    );

    return user;
  }
}
