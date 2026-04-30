import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../../src/components/layout/Sidebar';
import { AuthContext, type AuthContextValue } from '../../../src/contexts/AuthContext';

interface RenderOptions extends Partial<Parameters<typeof Sidebar>[0]> {
  isAdmin?: boolean;
}

function renderSidebar(props: RenderOptions = {}) {
  const onMobileClose = props.onMobileClose ?? vi.fn();
  const auth: AuthContextValue = {
    user: null,
    token: null,
    isAuthenticated: true,
    isAdmin: props.isAdmin ?? false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <Sidebar mobileOpen={props.mobileOpen ?? false} onMobileClose={onMobileClose} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return { onMobileClose };
}

describe('Sidebar', () => {
  it('renders the primary nav links in the desktop aside', () => {
    renderSidebar();
    expect(screen.getByRole('complementary', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('renders the mobile drawer with aria-hidden=true when closed', () => {
    renderSidebar({ mobileOpen: false });
    const drawer = screen.getByTestId('mobile-drawer');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
    expect(drawer.className).toContain('-translate-x-full');
  });

  it('renders the mobile drawer with aria-hidden=false and a backdrop when open', () => {
    renderSidebar({ mobileOpen: true });
    const drawer = screen.getByTestId('mobile-drawer');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
    expect(drawer.className).toContain('translate-x-0');
    expect(screen.getAllByRole('button', { name: 'Close navigation' }).length).toBeGreaterThanOrEqual(1);
  });

  it('calls onMobileClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });

    const buttons = screen.getAllByRole('button', { name: 'Close navigation' });
    await user.click(buttons[0]);
    expect(onMobileClose).toHaveBeenCalled();
  });

  it('calls onMobileClose when Escape is pressed while open', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });

    await user.keyboard('{Escape}');
    expect(onMobileClose).toHaveBeenCalled();
  });

  it('does not react to Escape when the drawer is already closed', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: false, onMobileClose });

    await user.keyboard('{Escape}');
    expect(onMobileClose).not.toHaveBeenCalled();
  });

  it('hides the User Management link from non-admins', () => {
    renderSidebar({ isAdmin: false });
    expect(screen.queryAllByRole('link', { name: 'User Management' })).toHaveLength(0);
  });

  it('shows the User Management link to admins', () => {
    renderSidebar({ isAdmin: true });
    expect(screen.getAllByRole('link', { name: 'User Management' }).length).toBeGreaterThan(0);
  });
});
