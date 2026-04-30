import { TaskStatus } from './TaskStatus';
import { TaskPriority } from './TaskPriority';

export interface TaskFilterProps {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  tags?: string[];
  search?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

export class TaskFilter {
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeId?: string;
  readonly tags: string[];
  readonly search?: string;
  readonly dueBefore?: Date;
  readonly dueAfter?: Date;

  private constructor(props: TaskFilterProps) {
    this.status = props.status;
    this.priority = props.priority;
    this.assigneeId = props.assigneeId;
    this.tags = props.tags ?? [];
    this.search = props.search?.trim().toLowerCase();
    this.dueBefore = props.dueBefore;
    this.dueAfter = props.dueAfter;
  }

  static create(props: TaskFilterProps): TaskFilter {
    if (props.dueBefore && props.dueAfter && props.dueBefore < props.dueAfter) {
      throw new Error('VALIDATION_ERROR: dueBefore must not be earlier than dueAfter');
    }
    return new TaskFilter(props);
  }

  get isEmpty(): boolean {
    return (
      !this.status &&
      !this.priority &&
      !this.assigneeId &&
      this.tags.length === 0 &&
      !this.search &&
      !this.dueBefore &&
      !this.dueAfter
    );
  }
}
