import { Role } from '../../domain/Role';

export interface UserSummaryDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}
