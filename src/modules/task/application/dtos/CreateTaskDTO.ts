import { z } from 'zod';
import { TaskPriority } from '../../domain/TaskPriority';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  assigneeId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>;
