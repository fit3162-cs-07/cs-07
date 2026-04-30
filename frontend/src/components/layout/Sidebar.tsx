import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/kanban', label: 'Kanban' },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border py-4 px-2 hidden md:block">
      <nav className="flex flex-col gap-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'px-3 py-2 rounded-md text-base font-medium',
                isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-primary-soft',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
