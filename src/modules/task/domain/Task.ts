import { Entity } from '../../../shared/domain/Entity';
import { TaskStatus } from './TaskStatus';
import { TaskPriority } from './TaskPriority';

export class Task extends Entity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  createdBy: string;
  clubId?: string;

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
  }

  assign(assigneeId: string): void {
    this.assigneeId = assigneeId;
    this.touch();
  }

  changeStatus(status: TaskStatus): void {
    this.status = status;
    this.touch();
  }

  update(props: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'status'>>): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.description !== undefined) this.description = props.description;
    if (props.priority !== undefined) this.priority = props.priority;
    if (props.dueDate !== undefined) this.dueDate = props.dueDate;
    if (props.status !== undefined) this.status = props.status;
    this.touch();
  }
}
