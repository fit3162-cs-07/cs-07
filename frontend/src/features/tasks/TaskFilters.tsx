import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useUsers } from '../../hooks/useUsers';
import type { TaskFilterInput, TaskPriority, TaskStatus } from '../../api/types';

export interface TaskFiltersProps {
  value: TaskFilterInput;
  onChange(next: TaskFilterInput): void;
  onClear(): void;
  layout?: 'sidebar' | 'bar';
}

export function TaskFilters({ value, onChange, onClear, layout = 'sidebar' }: TaskFiltersProps) {
  const { users, loading: usersLoading } = useUsers();

  const set = <K extends keyof TaskFilterInput>(key: K, v: TaskFilterInput[K]) =>
    onChange({ ...value, [key]: v });

  const tagText = value.tag?.join(', ') ?? '';

  const fields = (
    <>
      <Field label="Search" hint="Title or description">
        <Input
          placeholder="Search keyword"
          value={value.search ?? ''}
          onChange={e => set('search', e.target.value || undefined)}
        />
      </Field>
      <Field label="Status">
        <Select
          value={value.status ?? ''}
          onChange={e => set('status', (e.target.value || undefined) as TaskStatus | undefined)}
        >
          <option value="">All</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </Select>
      </Field>
      <Field label="Priority">
        <Select
          value={value.priority ?? ''}
          onChange={e =>
            set('priority', (e.target.value || undefined) as TaskPriority | undefined)
          }
        >
          <option value="">All</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </Field>
      <Field label="Assignee" hint={usersLoading ? 'Loading users…' : undefined}>
        <Select
          value={value.assigneeId ?? ''}
          onChange={e => set('assigneeId', e.target.value || undefined)}
          disabled={usersLoading}
        >
          <option value="">Anyone</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tags" hint="Comma-separated">
        <Input
          placeholder="events, urgent"
          value={tagText}
          onChange={e => {
            const arr = e.target.value
              .split(',')
              .map(t => t.trim())
              .filter(Boolean);
            set('tag', arr.length ? arr : undefined);
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4 col-span-2 lg:col-span-2">
        <Field label="Due after">
          <Input
            type="date"
            className="min-w-[140px]"
            value={value.dueAfter ? value.dueAfter.slice(0, 10) : ''}
            onChange={e =>
              set(
                'dueAfter',
                e.target.value ? new Date(e.target.value).toISOString() : undefined,
              )
            }
          />
        </Field>
        <Field label="Due before">
          <Input
            type="date"
            className="min-w-[140px]"
            value={value.dueBefore ? value.dueBefore.slice(0, 10) : ''}
            onChange={e =>
              set(
                'dueBefore',
                e.target.value ? new Date(e.target.value).toISOString() : undefined,
              )
            }
          />
        </Field>
      </div>
    </>
  );

  if (layout === 'bar') {
    return (
      <Card padded={false} className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          {fields}
          <Button variant="secondary" onClick={onClear}>
            Clear
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <details open data-testid="filters-toggle">
        <summary className="text-h3 font-semibold text-text-primary cursor-pointer select-none">
          Filters
        </summary>
        <div className="flex flex-col gap-4 mt-4">
          {fields}
          <Button variant="secondary" onClick={onClear} className="w-full">
            Clear filters
          </Button>
        </div>
      </details>
    </Card>
  );
}
