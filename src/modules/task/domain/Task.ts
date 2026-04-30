import { Entity } from '../../../shared/domain/Entity';
import { TaskStatus } from './TaskStatus';
import { TaskPriority } from './TaskPriority';
import { Tag } from './Tag';

export class Task extends Entity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  createdBy: string;
  clubId?: string;
  tags: Tag[];

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
    tags?: string[];
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
    this.tags = props.tags ? Tag.createMany(props.tags) : [];
  }

  assign(assigneeId: string): void {
    this.assigneeId = assigneeId;
    this.touch();
  }

  changeStatus(status: TaskStatus): void {
    this.status = status;
    this.touch();
  }

  setTags(rawTags: string[]): void {
    this.tags = Tag.createMany(rawTags);
    this.touch();
  }

  hasTag(tagValue: string): boolean {
    const normalized = tagValue.trim().toLowerCase();
    return this.tags.some(t => t.value === normalized);
  }

  update(props: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'status'>> & { tags?: string[] }): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.description !== undefined) this.description = props.description;
    if (props.priority !== undefined) this.priority = props.priority;
    if (props.dueDate !== undefined) this.dueDate = props.dueDate;
    if (props.status !== undefined) this.status = props.status;
    if (props.tags !== undefined) this.tags = Tag.createMany(props.tags);
    this.touch();
  }
}
