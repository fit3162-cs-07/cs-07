import { INotificationRepository } from '../domain/INotificationRepository';
import { UseCase } from '../../../shared/application/UseCase';

export interface GetUnreadCountInput {
  userId: string;
}

export interface GetUnreadCountResult {
  count: number;
}

export class GetUnreadCountUseCase implements UseCase<GetUnreadCountInput, GetUnreadCountResult> {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(input: GetUnreadCountInput): Promise<GetUnreadCountResult> {
    const count = await this.repo.countUnread(input.userId);
    return { count };
  }
}
