import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersPage } from '../../src/pages/AdminUsersPage';
import { AuthContext, type AuthContextValue } from '../../src/contexts/AuthContext';
import { UsersContext, type UsersContextValue } from '../../src/contexts/UsersContext';
import { ToastContext, type ToastContextValue } from '../../src/components/ui/Toast';
import type { User, UserSummary } from '../../src/api/types';
import * as usersApi from '../../src/api/users';

vi.mock('../../src/api/users', () => ({
  adminUpdateUser: vi.fn(),
  adminDeactivateUser: vi.fn(),
  adminActivateUser: vi.fn(),
  listUsers: vi.fn(),
}));

const mockedAdminUpdate = vi.mocked(usersApi.adminUpdateUser);
const mockedAdminDeactivate = vi.mocked(usersApi.adminDeactivateUser);
const mockedAdminActivate = vi.mocked(usersApi.adminActivateUser);

const adminUser: User = {
  id: 'admin-1',
  name: 'Ada Admin',
  email: 'ada@test.com',
  role: 'ADMIN',
  isActive: true,
};

const otherAdmin: UserSummary = {
  id: 'admin-2',
  name: 'Other Admin',
  email: 'other-admin@test.com',
  role: 'ADMIN',
  isActive: true,
};

const memberUser: UserSummary = {
  id: 'member-1',
  name: 'Bob Member',
  email: 'bob@test.com',
  role: 'MEMBER',
  isActive: true,
};

const inactiveUser: UserSummary = {
  id: 'member-2',
  name: 'Carol Inactive',
  email: 'carol@test.com',
  role: 'MEMBER',
  isActive: false,
};

interface RenderOptions {
  users?: UserSummary[];
  loading?: boolean;
  error?: string | null;
  refresh?: () => Promise<void>;
  me?: User | null;
}

function renderPage({
  users = [
    { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role, isActive: adminUser.isActive },
    otherAdmin,
    memberUser,
    inactiveUser,
  ],
  loading = false,
  error = null,
  refresh = vi.fn(async () => undefined),
  me = adminUser,
}: RenderOptions = {}) {
  const auth: AuthContextValue = {
    user: me,
    token: me ? 'tok' : null,
    isAuthenticated: !!me,
    isAdmin: me?.role === 'ADMIN',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  const usersCtx: UsersContextValue = {
    users,
    loading,
    error,
    refresh,
    lookup: id => users.find(u => u.id === id),
    displayName: id => users.find(u => u.id === id)?.name ?? 'Unassigned',
  };
  const toast: ToastContextValue = { show: vi.fn() };

  render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <UsersContext.Provider value={usersCtx}>
          <ToastContext.Provider value={toast}>
            <AdminUsersPage />
          </ToastContext.Provider>
        </UsersContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { refresh, toast };
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockedAdminUpdate.mockReset();
    mockedAdminDeactivate.mockReset();
    mockedAdminActivate.mockReset();
  });

  it('renders the user table with all rows including a (you) marker', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
    expect(screen.getByText('Ada Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob Member')).toBeInTheDocument();
    expect(screen.getByText('Carol Inactive')).toBeInTheDocument();
    expect(screen.getByText(/\(you\)/)).toBeInTheDocument();
  });

  it('renders Active and Inactive badges per user', () => {
    renderPage();
    const carolRow = screen.getByTestId(`user-row-${inactiveUser.id}`);
    expect(within(carolRow).getByText('Inactive')).toBeInTheDocument();
    const bobRow = screen.getByTestId(`user-row-${memberUser.id}`);
    expect(within(bobRow).getByText('Active')).toBeInTheDocument();
  });

  it('disables the Deactivate action for the current admin on themselves', () => {
    renderPage();
    const myRow = screen.getByTestId(`user-row-${adminUser.id}`);
    const deactivate = within(myRow).getByRole('button', { name: 'Deactivate' });
    expect(deactivate).toBeDisabled();
  });

  it('opens the edit modal, saves name + role changes, and refreshes', async () => {
    const user = userEvent.setup();
    mockedAdminUpdate.mockResolvedValue({ ...memberUser, name: 'Bobby M', role: 'ADMIN' });
    const { refresh } = renderPage();

    const row = screen.getByTestId(`user-row-${memberUser.id}`);
    await user.click(within(row).getByRole('button', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Bobby M');

    const roleSelect = within(dialog).getByLabelText(/Role/);
    await user.selectOptions(roleSelect, 'ADMIN');

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mockedAdminUpdate).toHaveBeenCalledWith(memberUser.id, { name: 'Bobby M', role: 'ADMIN' }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('disables the role select when editing your own row', async () => {
    const user = userEvent.setup();
    renderPage();

    const row = screen.getByTestId(`user-row-${adminUser.id}`);
    await user.click(within(row).getByRole('button', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog');
    const roleSelect = within(dialog).getByLabelText(/Role/);
    expect(roleSelect).toBeDisabled();
  });

  it('confirms deactivation, calls the API, and refreshes', async () => {
    const user = userEvent.setup();
    mockedAdminDeactivate.mockResolvedValue({ ...memberUser, isActive: false });
    const { refresh } = renderPage();

    const row = screen.getByTestId(`user-row-${memberUser.id}`);
    await user.click(within(row).getByRole('button', { name: 'Deactivate' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/will no longer be able to sign in/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(mockedAdminDeactivate).toHaveBeenCalledWith(memberUser.id));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('reactivates an inactive user via the Activate action', async () => {
    const user = userEvent.setup();
    mockedAdminActivate.mockResolvedValue({ ...inactiveUser, isActive: true });
    const { refresh } = renderPage();

    const row = screen.getByTestId(`user-row-${inactiveUser.id}`);
    await user.click(within(row).getByRole('button', { name: 'Activate' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Activate' }));

    await waitFor(() => expect(mockedAdminActivate).toHaveBeenCalledWith(inactiveUser.id));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('shows an empty state when there are no users', () => {
    renderPage({ users: [] });
    expect(screen.getByText('No users yet')).toBeInTheDocument();
  });

  it('shows an error state with a retry button', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn(async () => undefined);
    renderPage({ users: [], error: 'boom', refresh });

    expect(screen.getByText("Couldn't load users")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalled();
  });
});
