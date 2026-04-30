import { z } from 'zod';
import { Role } from '../../domain/Role';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine(v => v.name !== undefined || v.role !== undefined, {
    message: 'At least one of name or role is required',
  });

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
