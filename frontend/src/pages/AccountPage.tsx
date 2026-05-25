import { useState, type FormEvent } from 'react';
import { Card, CardSubtitle, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import * as userApi from '../api/users';
import { ApiError } from '../api/client';

export function AccountPage() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwError, setPwError] = useState<{
    field: 'current' | 'new' | 'confirm';
    message: string;
  } | null>(null);

  if (!user) return null;

  const onSubmitName = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }
    if (trimmed === user.name) {
      setNameError('Name is unchanged.');
      return;
    }
    setNameError(null);
    setSavingName(true);
    try {
      const updated = await userApi.updateProfile(trimmed);
      updateUser(updated);
      show('Profile updated', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile';
      show(msg, 'error');
    } finally {
      setSavingName(false);
    }
  };

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwError({ field: 'current', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwError({ field: 'new', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError({ field: 'confirm', message: 'Passwords do not match.' });
      return;
    }
    setPwError(null);
    setSavingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      show('Password updated', 'success');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CURRENT_PASSWORD') {
        setPwError({ field: 'current', message: 'Current password is incorrect.' });
      } else {
        const msg = err instanceof ApiError ? err.message : 'Failed to update password';
        show(msg, 'error');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Account settings"
        description="Manage your name, email, and password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Profile</CardTitle>
          <CardSubtitle>
            Email and role are managed by your club administrator.
          </CardSubtitle>
          <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
            <dt className="text-text-tertiary font-medium">Email</dt>
            <dd className="text-text-primary font-mono text-xs">{user.email}</dd>
            <dt className="text-text-tertiary font-medium">Role</dt>
            <dd className="text-text-primary">
              {user.role === 'ADMIN' ? 'Admin' : 'Member'}
            </dd>
          </dl>

          <form onSubmit={onSubmitName} className="mt-6 flex flex-col gap-4" noValidate>
            <Field
              label="Display name"
              htmlFor="account-name"
              required
              error={nameError ?? undefined}
            >
              <Input
                id="account-name"
                value={name}
                onChange={e => setName(e.target.value)}
                invalid={!!nameError}
                maxLength={100}
                autoComplete="name"
              />
            </Field>
            <div>
              <Button type="submit" loading={savingName}>
                Save name
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Change password</CardTitle>
          <CardSubtitle>Use at least 8 characters.</CardSubtitle>

          <form onSubmit={onSubmitPassword} className="mt-6 flex flex-col gap-4" noValidate>
            <Field
              label="Current password"
              htmlFor="account-current-password"
              required
              error={pwError?.field === 'current' ? pwError.message : undefined}
            >
              <Input
                id="account-current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                invalid={pwError?.field === 'current'}
                autoComplete="current-password"
              />
            </Field>
            <Field
              label="New password"
              htmlFor="account-new-password"
              required
              error={pwError?.field === 'new' ? pwError.message : undefined}
            >
              <Input
                id="account-new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                invalid={pwError?.field === 'new'}
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm new password"
              htmlFor="account-confirm-password"
              required
              error={pwError?.field === 'confirm' ? pwError.message : undefined}
            >
              <Input
                id="account-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                invalid={pwError?.field === 'confirm'}
                autoComplete="new-password"
              />
            </Field>
            <div>
              <Button type="submit" loading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
