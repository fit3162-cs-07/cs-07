export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  createdBy: string;
  clubId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actor: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskFilterInput {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  tag?: string[];
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}
