import { NotificationType } from '../../domain/NotificationType';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  sourceAggregateId?: string;
  createdAt: string;
}
