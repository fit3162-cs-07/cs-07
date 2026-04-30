import { INotificationRepository } from '../domain/INotificationRepository';
import { UseCase } from '../../../shared/application/UseCase';

export interface MarkAllReadInput {
  userId: string;
}

export interface MarkAllReadResult {
  updated: number;
}

export class MarkAllReadUseCase implements UseCase<MarkAllReadInput, MarkAllReadResult> {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(input: MarkAllReadInput): Promise<MarkAllReadResult> {
    const updated = await this.repo.markAllRead(input.userId);
    return { updated };
  }
}
