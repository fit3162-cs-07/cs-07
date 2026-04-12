const BASE = 'http://localhost:3000/api/v1';

let token = '';

export function setToken(t: string) { token = t; }
export function getToken() { return token; }

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Request failed');
  return json.data;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function register(email: string, name: string, password: string, role: string): Promise<{ user: User }> {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, role }),
  });
  return data;
}

export async function getTasks(filters?: Record<string, string>): Promise<Task[]> {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  return await request(`/tasks${qs ? `?${qs}` : ''}`);
}

export async function getTask(id: string): Promise<Task> {
  return await request(`/tasks/${id}`);
}

export async function createTask(body: Partial<Task>): Promise<Task> {
  return await request('/tasks', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateTask(id: string, body: Partial<Task>): Promise<Task> {
  return await request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  return await request(`/tasks/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigneeId }) });
}

export async function changeStatus(id: string, status: string): Promise<Task> {
  return await request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
