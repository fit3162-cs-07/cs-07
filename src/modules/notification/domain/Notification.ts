import { Entity } from '../../../shared/domain/Entity';
import { NotificationType } from './NotificationType';

export interface NotificationProps {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  sourceAggregateId?: string;
  isRead?: boolean;
}

export class Notification extends Entity {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  sourceAggregateId?: string;
  isRead: boolean;

  constructor(props: NotificationProps) {
    super(props.id);
    this.userId = props.userId;
    this.type = props.type;
    this.title = props.title;
    this.body = props.body;
    this.link = props.link;
    this.sourceAggregateId = props.sourceAggregateId;
    this.isRead = props.isRead ?? false;
  }

  markRead(): void {
    if (this.isRead) return;
    this.isRead = true;
    this.touch();
  }
}
