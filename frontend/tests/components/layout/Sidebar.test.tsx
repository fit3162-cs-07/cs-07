import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../../src/components/layout/Sidebar';

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const onMobileClose = props.onMobileClose ?? vi.fn();
  render(
    <MemoryRouter>
      <Sidebar mobileOpen={props.mobileOpen ?? false} onMobileClose={onMobileClose} />
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
});
