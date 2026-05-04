import { Entity } from '../../../shared/domain/Entity';
import { TaskStatus } from './TaskStatus';
import { TaskPriority } from './TaskPriority';

export interface TaskAttachment {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export class Task extends Entity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  createdBy: string;
  clubId?: string;
  attachment?: TaskAttachment;

  constructor(props: {
    id?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: Date;
    createdBy: string;
    clubId?: string;
    attachment?: TaskAttachment;
  }) {
    super(props.id);
    this.title = props.title;
    this.description = props.description ?? '';
    this.status = props.status ?? TaskStatus.TODO;
    this.priority = props.priority ?? TaskPriority.MEDIUM;
    this.assigneeId = props.assigneeId;
    this.dueDate = props.dueDate;
    this.createdBy = props.createdBy;
    this.clubId = props.clubId;
    this.attachment = props.attachment;
  }

  assign(assigneeId: string): void {
    this.assigneeId = assigneeId;
    this.touch();
  }

  changeStatus(status: TaskStatus): void {
    this.status = status;
    this.touch();
  }

  update(
    props: Partial<
      Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'status' | 'attachment'>
    >
  ): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.description !== undefined) this.description = props.description;
    if (props.priority !== undefined) this.priority = props.priority;
    if (props.dueDate !== undefined) this.dueDate = props.dueDate;
    if (props.status !== undefined) this.status = props.status;
    if (props.attachment !== undefined) this.attachment = props.attachment;
    this.touch();
  }
}
