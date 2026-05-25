import { Schema, model, Model } from 'mongoose';
import { TaskStatus } from '../domain/TaskStatus';
import { TaskPriority } from '../domain/TaskPriority';

export interface TaskDoc {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  createdBy: string;
  clubId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDoc>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO, index: true },
    priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM },
    assigneeId: { type: String, index: true },
    dueDate: { type: Date },
    createdBy: { type: String, required: true, index: true },
    clubId: { type: String },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    _id: false,
    versionKey: false,
    collection: 'tasks',
    timestamps: false,
  },
);

taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

export const TaskModel: Model<TaskDoc> = model<TaskDoc>('Task', taskSchema);
