import { z } from 'zod';
import { TaskPriority } from '../../domain/TaskPriority';
import { TaskStatus } from '../../domain/TaskStatus';

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export type UpdateTaskDTO = z.infer<typeof UpdateTaskSchema>;
