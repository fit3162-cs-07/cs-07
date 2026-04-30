import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TopNav } from '../../../src/components/layout/TopNav';
import { AuthContext, type AuthContextValue } from '../../../src/contexts/AuthContext';

function renderTopNav(onMenuToggle = vi.fn()) {
  const authValue: AuthContextValue = {
    user: { id: 'u-1', email: 'sam@example.com', name: 'Sam Member', role: 'MEMBER' },
    token: 'tok',
    isAuthenticated: true,
    isAdmin: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <TopNav onMenuToggle={onMenuToggle} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return { authValue };
}

describe('TopNav', () => {
  it('renders an open-navigation button that calls onMenuToggle when clicked', async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    renderTopNav(onMenuToggle);

    const button = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(button);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('shows the user name from auth context', () => {
    renderTopNav();
    expect(screen.getByText('Sam Member')).toBeInTheDocument();
  });

  it('renders the brand label twice (long + short variants for responsive switch)', () => {
    renderTopNav();
    expect(screen.getByText('Monash Club Tasks')).toBeInTheDocument();
    expect(screen.getByText('MCT')).toBeInTheDocument();
  });
});
