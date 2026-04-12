import { z } from 'zod';

export const AssignTaskSchema = z.object({
  assigneeId: z.string().uuid(),
});

export type AssignTaskDTO = z.infer<typeof AssignTaskSchema>;
