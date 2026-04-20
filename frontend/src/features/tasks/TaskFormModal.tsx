import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Field } from '../../components/ui/Field';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../api/client';
import * as taskApi from '../../api/tasks';
import type { Task, TaskPriority, TaskStatus } from '../../api/types';

export interface TaskFormModalProps {
  open: boolean;
  task: Task | null;
  onClose(): void;
  onSaved(task: Task): void;
}

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  dueDate: string;
  tagsInput: string;
}

function fromTask(task: Task | null): FormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'TODO',
    assigneeId: task?.assigneeId ?? '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tagsInput: task?.tags?.join(', ') ?? '',
  };
}

function toTagArray(input: string): string[] {
  return input
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

function toIsoDate(yyyymmdd: string): string | undefined {
  if (!yyyymmdd) return undefined;
  return new Date(`${yyyymmdd}T00:00:00.000Z`).toISOString();
}

export function TaskFormModal({ open, task, onClose, onSaved }: TaskFormModalProps) {
  const { isAdmin } = useAuth();
  const { show } = useToast();
  const isEdit = task !== null;

  const [form, setForm] = useState<FormState>(() => fromTask(task));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromTask(task));
      setErrors({});
    }
  }, [open, task]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(curr => ({ ...curr, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (form.title.length > 200) next.title = 'Title must be at most 200 characters';
    if (
      form.assigneeId &&
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(form.assigneeId)
    ) {
      next.assigneeId = 'Must be a valid user UUID';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueDate: toIsoDate(form.dueDate),
        assigneeId: form.assigneeId || undefined,
        tags: toTagArray(form.tagsInput),
      };

      let saved: Task;
      if (isEdit && task) {
        saved = await taskApi.updateTask(task.id, payload);
        if (form.status !== task.status) {
          saved = await taskApi.changeStatus(task.id, form.status);
        }
        if (isAdmin && form.assigneeId && form.assigneeId !== task.assigneeId) {
          saved = await taskApi.assignTask(task.id, form.assigneeId);
        }
        show('Task updated', 'success');
      } else {
        saved = await taskApi.createTask(payload);
        show('Task created', 'success');
      }
      onSaved(saved);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save task';
      show(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} type="submit">
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Title" required error={errors.title} htmlFor="task-title">
          <Input
            id="task-title"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            invalid={!!errors.title}
            placeholder="e.g. Book venue for O-Week stall"
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="task-desc">
          <Textarea
            id="task-desc"
            rows={3}
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Optional context for the task"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <Select value={form.priority} onChange={e => update('priority', e.target.value as TaskPriority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={form.dueDate}
              onChange={e => update('dueDate', e.target.value)}
            />
          </Field>
        </div>

        {isEdit && (
          <Field label="Status">
            <Select value={form.status} onChange={e => update('status', e.target.value as TaskStatus)}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </Select>
          </Field>
        )}

        {isAdmin && (
          <Field
            label="Assignee user ID"
            hint="Paste a user UUID. A user-picker arrives once the backend exposes /users."
            error={errors.assigneeId}
            htmlFor="task-assignee"
          >
            <Input
              id="task-assignee"
              value={form.assigneeId}
              onChange={e => update('assigneeId', e.target.value)}
              invalid={!!errors.assigneeId}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </Field>
        )}

        <Field
          label="Tags"
          hint="Comma-separated. Persisted after the R5 task-filter PR merges."
          htmlFor="task-tags"
        >
          <Input
            id="task-tags"
            value={form.tagsInput}
            onChange={e => update('tagsInput', e.target.value)}
            placeholder="events, urgent"
          />
        </Field>
      </form>
    </Modal>
  );
}
