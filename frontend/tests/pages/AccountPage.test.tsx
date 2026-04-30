import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AccountPage } from '../../src/pages/AccountPage';
import { AuthContext } from '../../src/contexts/AuthContext';
import { ToastContext } from '../../src/components/ui/Toast';
import { ApiError } from '../../src/api/client';
import type { User } from '../../src/api/types';

vi.mock('../../src/api/users', () => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

import * as userApi from '../../src/api/users';

const updateProfileMock = vi.mocked(userApi.updateProfile);
const changePasswordMock = vi.mocked(userApi.changePassword);

const SAMPLE_USER: User = {
  id: 'u1',
  email: 'mark@monash.edu',
  name: 'Mark Member',
  role: 'MEMBER',
};

interface RenderOpts {
  user?: User | null;
  show?: ReturnType<typeof vi.fn>;
  updateUser?: ReturnType<typeof vi.fn>;
}

function renderAccountPage({ user = SAMPLE_USER, show, updateUser }: RenderOpts = {}) {
  const showFn = show ?? vi.fn();
  const updateUserFn = updateUser ?? vi.fn();
  const authValue = {
    user,
    token: user ? 'jwt-token' : null,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: updateUserFn,
  };
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={{ show: showFn }}>{children}</ToastContext.Provider>
    </AuthContext.Provider>
  );
  return {
    showFn,
    updateUserFn,
    ...render(<AccountPage />, { wrapper: Wrapper }),
  };
}

describe('AccountPage profile form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the user email and role (read-only)', () => {
    renderAccountPage();
    expect(screen.getByText('mark@monash.edu')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('renders an Admin label for admin users', () => {
    renderAccountPage({
      user: { ...SAMPLE_USER, role: 'ADMIN' },
    });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('blocks submission with an empty name and shows inline error', async () => {
    const user = userEvent.setup();
    renderAccountPage();

    const nameInput = screen.getByLabelText(/Display name/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('blocks submission when the name is unchanged', async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await user.click(screen.getByRole('button', { name: 'Save name' }));

    expect(screen.getByText('Name is unchanged.')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('PATCHes the trimmed name, updates auth, and shows a success toast', async () => {
    const user = userEvent.setup();
    const updated: User = { ...SAMPLE_USER, name: 'Mark Renamed' };
    updateProfileMock.mockResolvedValue(updated);

    const { showFn, updateUserFn } = renderAccountPage();

    const nameInput = screen.getByLabelText(/Display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, '  Mark Renamed  ');
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1));
    expect(updateProfileMock).toHaveBeenCalledWith('Mark Renamed');
    expect(updateUserFn).toHaveBeenCalledWith(updated);
    expect(showFn).toHaveBeenCalledWith('Profile updated', 'success');
  });

  it('surfaces an ApiError message via the toast', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockRejectedValue(new ApiError('Server exploded', 'INTERNAL', 500));

    const { showFn } = renderAccountPage();

    const nameInput = screen.getByLabelText(/Display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    await waitFor(() => expect(showFn).toHaveBeenCalledWith('Server exploded', 'error'));
  });

  it('falls back to a generic message for unknown errors', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockRejectedValue(new Error('network down'));

    const { showFn } = renderAccountPage();

    const nameInput = screen.getByLabelText(/Display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    await waitFor(() =>
      expect(showFn).toHaveBeenCalledWith('Failed to update profile', 'error'),
    );
  });
});

describe('AccountPage password form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requires the current password before submission', async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Current password is required.')).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('rejects new passwords shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await user.type(screen.getByLabelText(/Current password/), 'oldsecret');
    await user.type(screen.getByLabelText(/^New password/), 'short');
    await user.type(screen.getByLabelText(/Confirm new password/), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      screen.getByText('New password must be at least 8 characters.'),
    ).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('rejects when new and confirm do not match', async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await user.type(screen.getByLabelText(/Current password/), 'oldsecret');
    await user.type(screen.getByLabelText(/^New password/), 'longenough1');
    await user.type(screen.getByLabelText(/Confirm new password/), 'differentvalue');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('submits, clears the fields, and shows a success toast on happy path', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockResolvedValue();

    const { showFn } = renderAccountPage();

    const current = screen.getByLabelText(/Current password/) as HTMLInputElement;
    const next = screen.getByLabelText(/^New password/) as HTMLInputElement;
    const confirm = screen.getByLabelText(/Confirm new password/) as HTMLInputElement;

    await user.type(current, 'oldsecret');
    await user.type(next, 'newsecret1');
    await user.type(confirm, 'newsecret1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledTimes(1));
    expect(changePasswordMock).toHaveBeenCalledWith('oldsecret', 'newsecret1');
    await waitFor(() => expect(showFn).toHaveBeenCalledWith('Password updated', 'success'));

    expect(current.value).toBe('');
    expect(next.value).toBe('');
    expect(confirm.value).toBe('');
  });

  it('flags the current-password field on INVALID_CURRENT_PASSWORD', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockRejectedValue(
      new ApiError('Wrong password', 'INVALID_CURRENT_PASSWORD', 400),
    );

    const { showFn } = renderAccountPage();

    await user.type(screen.getByLabelText(/Current password/), 'badguess');
    await user.type(screen.getByLabelText(/^New password/), 'newsecret1');
    await user.type(screen.getByLabelText(/Confirm new password/), 'newsecret1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      await screen.findByText('Current password is incorrect.'),
    ).toBeInTheDocument();
    expect(showFn).not.toHaveBeenCalled();
  });

  it('uses the toast for non-credential ApiErrors', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockRejectedValue(new ApiError('Server down', 'INTERNAL', 500));

    const { showFn } = renderAccountPage();

    await user.type(screen.getByLabelText(/Current password/), 'oldsecret');
    await user.type(screen.getByLabelText(/^New password/), 'newsecret1');
    await user.type(screen.getByLabelText(/Confirm new password/), 'newsecret1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => expect(showFn).toHaveBeenCalledWith('Server down', 'error'));
  });
});
