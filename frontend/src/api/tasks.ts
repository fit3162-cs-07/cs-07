import { apiClient, type ApiResult } from './client';
import type {
  Task,
  TaskFilterInput,
  TaskPriority,
  TaskStatus,
} from './types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

function buildQuery(filter: TaskFilterInput): string {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.priority) params.set('priority', filter.priority);
  if (filter.assigneeId) params.set('assigneeId', filter.assigneeId);
  if (filter.search) params.set('search', filter.search);
  if (filter.dueBefore) params.set('dueBefore', filter.dueBefore);
  if (filter.dueAfter) params.set('dueAfter', filter.dueAfter);
  if (filter.page !== undefined) params.set('page', String(filter.page));
  if (filter.limit !== undefined) params.set('limit', String(filter.limit));
  if (filter.tag) {
    for (const t of filter.tag) params.append('tag', t);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listTasks(filter: TaskFilterInput = {}): Promise<ApiResult<Task[]>> {
  return apiClient.get<Task[]>(`/tasks${buildQuery(filter)}`);
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await apiClient.get<Task>(`/tasks/${id}`);
  return data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await apiClient.post<Task>('/tasks', input);
  return data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await apiClient.put<Task>(`/tasks/${id}`, input);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  const { data } = await apiClient.patch<Task>(`/tasks/${id}/assign`, { assigneeId });
  return data;
}

export async function changeStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
  return data;
}
