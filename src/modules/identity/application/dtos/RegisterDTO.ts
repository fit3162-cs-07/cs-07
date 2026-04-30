import { z } from 'zod';
import { Role } from '../../domain/Role';

export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.nativeEnum(Role).optional().default(Role.MEMBER),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
