import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../../src/pages/LoginPage';
import { AuthContext, type AuthContextValue } from '../../src/contexts/AuthContext';
import { ToastContext, type ToastContextValue } from '../../src/components/ui/Toast';

interface RenderOptions {
  loginImpl?: AuthContextValue['login'];
  showImpl?: ToastContextValue['show'];
}

function renderLoginPage({ loginImpl, showImpl }: RenderOptions = {}) {
  const login = vi.fn(loginImpl ?? (async () => undefined));
  const show = vi.fn(showImpl ?? (() => undefined));

  const auth: AuthContextValue = {
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
    login,
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  const toast: ToastContextValue = { show };

  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={auth}>
        <ToastContext.Provider value={toast}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { login, show };
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the sign-in form', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('passes remember=false by default and calls login with the entered credentials', async () => {
    const user = userEvent.setup();
    const { login } = renderLoginPage();

    const password = screen.getByLabelText(/^Password/);
    await user.clear(password);
    await user.type(password, 'secret-1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('admin@monash.edu', 'secret-1234', false);
  });

  it('passes remember=true when the Remember-me box is checked', async () => {
    const user = userEvent.setup();
    const { login } = renderLoginPage();

    await user.click(screen.getByLabelText('Remember me'));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('admin@monash.edu', 'admin123', true);
  });

  it('toggles the password input type when Show / Hide is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows a toast when Forgot password is clicked', async () => {
    const user = userEvent.setup();
    const { show } = renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(show).toHaveBeenCalledWith(expect.stringContaining('Password reset'), 'success');
  });

  it('renders a top-of-form error alert when login throws', async () => {
    const user = userEvent.setup();
    const { login } = renderLoginPage({
      loginImpl: async () => {
        throw new Error('bad creds');
      },
    });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(login).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed');
  });
});
