import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  adminActivateUser,
  adminDeactivateUser,
  adminUpdateUser,
} from '../api/users';
import { ApiError } from '../api/client';
import type { Role, UserSummary } from '../api/types';

export function AdminUsersPage() {
  const { users, loading, error, refresh } = useUsers();
  const { user: me } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [confirming, setConfirming] = useState<UserSummary | null>(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const handleToggleActive = async (user: UserSummary) => {
    try {
      if (user.isActive) {
        await adminDeactivateUser(user.id);
        toast.show(`Deactivated ${user.name}`, 'success');
      } else {
        await adminActivateUser(user.id);
        toast.show(`Activated ${user.name}`, 'success');
      }
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed';
      toast.show(msg, 'error');
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Update names, change roles, and deactivate accounts."
      />

      {loading && users.length === 0 ? (
        <Card>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </Card>
      ) : error ? (
        <EmptyState
          title="Couldn't load users"
          description={error}
          action={
            <Button variant="secondary" onClick={() => refresh()}>
              Try again
            </Button>
          }
        />
      ) : sortedUsers.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border-default">
                  <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u, idx) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT ${
                        idx > 0 ? 'border-t border-border-default' : ''
                      }`}
                      data-testid={`user-row-${u.id}`}
                    >
                      <td className="px-4 py-3 text-text-primary font-medium">
                        {u.name}
                        {isSelf && (
                          <span className="text-text-tertiary font-normal ml-2">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === 'ADMIN' ? 'primary' : 'soft'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirming(u)}
                            disabled={isSelf && u.isActive}
                            title={
                              isSelf && u.isActive
                                ? 'You cannot deactivate yourself'
                                : undefined
                            }
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          isSelf={me?.id === editing.id}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {confirming && (
        <Modal
          open
          onClose={() => setConfirming(null)}
          title={confirming.isActive ? 'Deactivate user?' : 'Activate user?'}
          description={
            confirming.isActive
              ? `${confirming.name} will no longer be able to sign in.`
              : `${confirming.name} will regain access to the workspace.`
          }
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant={confirming.isActive ? 'danger' : 'primary'}
                onClick={() => handleToggleActive(confirming)}
              >
                {confirming.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary font-mono">{confirming.email}</p>
        </Modal>
      )}
    </div>
  );
}

interface EditUserModalProps {
  user: UserSummary;
  isSelf: boolean;
  onClose(): void;
  onSaved(): Promise<void>;
}

function EditUserModal({ user, isSelf, onClose, onSaved }: EditUserModalProps) {
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setRole(user.role);
    setTopError(null);
  }, [user]);

  const dirty = name.trim() !== user.name || role !== user.role;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTopError(null);
    if (!dirty) {
      onClose();
      return;
    }
    if (!name.trim()) {
      setTopError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload: { name?: string; role?: Role } = {};
      if (name.trim() !== user.name) payload.name = name.trim();
      if (role !== user.role) payload.role = role;
      await adminUpdateUser(user.id, payload);
      toast.show(`Updated ${user.name}`, 'success');
      await onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Update failed';
      setTopError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit user"
      description={user.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-user-form" loading={submitting} disabled={!dirty}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Name" required htmlFor="edit-user-name">
          <Input
            id="edit-user-name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Field>
        <Field
          label="Role"
          htmlFor="edit-user-role"
          hint={isSelf ? 'You cannot change your own role.' : undefined}
        >
          <Select
            id="edit-user-role"
            value={role}
            disabled={isSelf}
            onChange={e => setRole(e.target.value as Role)}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        {topError && (
          <div
            role="alert"
            className="text-sm text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2"
          >
            {topError}
          </div>
        )}
      </form>
    </Modal>
  );
}
