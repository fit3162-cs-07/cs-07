import { z } from 'zod';

// Self-registration always creates MEMBER accounts. Admins are seeded or
// promoted by an existing admin via PATCH /api/v1/users/:id.
export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
