import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from '../../src/pages/RegisterPage';
import { scorePassword } from '../../src/lib/passwordStrength';
import { AuthContext, type AuthContextValue } from '../../src/contexts/AuthContext';

interface RenderOptions {
  registerImpl?: AuthContextValue['register'];
}

function renderRegisterPage({ registerImpl }: RenderOptions = {}) {
  const register = vi.fn(registerImpl ?? (async () => undefined));

  const auth: AuthContextValue = {
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
    login: vi.fn(),
    register,
    logout: vi.fn(),
    updateUser: vi.fn(),
  };

  render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { register };
}

describe('scorePassword', () => {
  it('returns empty for an empty string', () => {
    expect(scorePassword('')).toEqual({ score: 0, label: 'empty' });
  });

  it('returns weak for short or simple passwords', () => {
    expect(scorePassword('abc').label).toBe('weak');
    expect(scorePassword('abcdefg').label).toBe('weak');
  });

  it('returns fair for 8+ chars with mixed case but no symbols', () => {
    expect(scorePassword('Abcdefghij12').label).toBe('fair');
  });

  it('returns strong when length, mixed case, digit, and symbol are all present', () => {
    expect(scorePassword('Abcdefghij1!').label).toBe('strong');
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the registration form', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows inline validation errors for empty / invalid fields and does not call register', async () => {
    const user = userEvent.setup();
    const { register } = renderRegisterPage();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('hides the strength meter when password is empty and shows it once typing begins', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Password/), 'abc');
    expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    expect(screen.getByTestId('password-strength-label')).toHaveTextContent(/Weak/);
  });

  it('updates the strength label as the password gets stronger', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    const password = screen.getByLabelText(/^Password/);

    await user.type(password, 'Abcdefghij1!');
    expect(screen.getByTestId('password-strength-label')).toHaveTextContent(/Strong/);
  });

  it('toggles the password input type when Show / Hide is clicked', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('submits valid credentials and passes remember=true when the box is checked', async () => {
    const user = userEvent.setup();
    const { register } = renderRegisterPage();

    await user.type(screen.getByLabelText(/^Full name/), 'New User');
    await user.type(screen.getByLabelText(/^Email/), 'new@monash.edu');
    await user.type(screen.getByLabelText(/^Password/), 'Abcdefghij1!');
    await user.click(screen.getByLabelText('Remember me'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(register).toHaveBeenCalledWith(
      { name: 'New User', email: 'new@monash.edu', password: 'Abcdefghij1!' },
      true,
    );
  });

  it('renders a top-of-form error alert when register throws', async () => {
    const user = userEvent.setup();
    renderRegisterPage({
      registerImpl: async () => {
        throw new Error('email taken');
      },
    });

    await user.type(screen.getByLabelText(/^Full name/), 'New User');
    await user.type(screen.getByLabelText(/^Email/), 'new@monash.edu');
    await user.type(screen.getByLabelText(/^Password/), 'Abcdefghij1!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed');
  });
});
