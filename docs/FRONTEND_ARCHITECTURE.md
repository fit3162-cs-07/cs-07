# Frontend Architecture

**Last updated:** 2026-04-30 (rev 8)

This document captures how the Monash Club Tasks frontend is organised, the
design rules every contributor must follow, and the conventions for adding new
pages, components, and API calls.

---

## Stack

- **Vite 8** + **React 19** + **TypeScript 5.9** (strict)
- **Tailwind CSS v3** for styling (config-first, no inline custom CSS beyond a
  tiny `index.css` base layer)
- **React Router v6** for routing
- **@dnd-kit/core** for the Kanban drag-and-drop
- **Inter** via Google Fonts (with `system-ui` fallback)

---

## Folder layout (`frontend/src/`)

```
api/              — fetch wrapper, typed endpoint helpers, DTO types
  client.ts       —   request(), apiClient, ApiError, JWT injection
  auth.ts         —   login, register, refresh
  tasks.ts        —   list/get/create/update/delete/assign/changeStatus
  users.ts        —   list users (RBAC-scoped) + getMe / updateProfile / changePassword
                      + adminUpdateUser / adminDeactivateUser / adminActivateUser
  audit.ts        —   audit log (admin only, gracefully empty otherwise)
  notifications.ts —  list / unread-count / mark-read / mark-all-read
  types.ts        —   User, UserSummary, Task, AuditEntry, TaskFilterInput, …
  index.ts        —   barrel re-exports

contexts/
  AuthContext.tsx —   AuthProvider, AuthContext; uses tokenStorage to persist
                      to localStorage (Remember me) or sessionStorage
  UsersContext.tsx —  UsersProvider — fetches /users once per session, exposes
                      `{ users, loading, error, refresh, lookup, displayName }`
  NotificationsContext.tsx —  NotificationsProvider — fetches the latest 20
                      notifications + unread-count on mount and every 30 s,
                      exposes `{ notifications, unreadCount, loading, error,
                      refresh, markRead, markAllRead }`

hooks/
  useAuth.ts      —   wraps AuthContext (throws if used outside Provider)
  useUsers.ts     —   wraps UsersContext (throws if used outside Provider)
  useToast.ts     —   wraps ToastContext
  useNotifications.ts — wraps NotificationsContext (throws if used outside Provider)

design/
  tokens.ts       —   typed exports of palette, spacing, type, radius, shadows

lib/
  cn.ts                —   `clsx` wrapper used by every component
  format.ts            —   formatDate, formatDateTime, daysUntil, relativeDeadline
  tokenStorage.ts      —   persistent (localStorage) + session-only (sessionStorage)
                           backends, `readPreferredAuth()`, `clearAllAuth()`
  passwordStrength.ts  —   `scorePassword(pw)` → `{ score, label }` for the
                           registration meter (extracted so RegisterPage can stay
                           component-only for fast refresh)

components/
  ProtectedRoute.tsx — redirects unauthenticated users to /login (preserves intended path)
  ErrorBoundary.tsx  — class boundary; mounted per-route in AppShell, resets on route change
  layout/
    AppShell.tsx     — TopNav + Sidebar + ErrorBoundary + <Outlet/>; owns
                       mobile drawer open/close state
    TopNav.tsx       — logo + hamburger (mobile) + NotificationsBell +
                       user menu
    Sidebar.tsx      — Dashboard / Tasks / Kanban (+ User Management for
                       admins); renders both the desktop aside and the
                       mobile slide-out drawer
  dashboard/
    UpcomingReminders.tsx — R3 surfacing widget for the dashboard
  notifications/
    NotificationsBell.tsx — bell button + popover panel; badge capped at 99+,
                            row click marks-read + navigates to `n.link`,
                            "Mark all read" only when at least one unread,
                            click-outside + Escape dismissal
  ui/
    Button, Input, Textarea, Select, Field, Card, Badge,
    Modal, Toast, Dropdown, PageHeader, EmptyState, Skeleton (+ SkeletonText)

features/
  tasks/
    TaskCard.tsx       — `list` and `compact` variants
    TaskFilters.tsx    — `sidebar` and `bar` layouts
    TaskFormModal.tsx  — reusable create/edit modal

pages/
  LoginPage, RegisterPage, DashboardPage,
  TasksPage, TaskDetailPage, KanbanPage, AccountPage,
  AdminUsersPage (admin-only at /admin/users), NotFoundPage

legacy/
  App.legacy.tsx + api.legacy.ts — original single-file demo, NOT mounted,
  excluded from tsc + eslint, kept only as reference for teammates
```

---

## Design system rules (NON-NEGOTIABLE)

The full reference is in [`docs/STYLE_GUIDE.md`](./STYLE_GUIDE.md). A live preview of every primitive renders at `/design/preview` in the running app. The summary below is a quick orientation; if it conflicts with the style guide, the style guide wins.

### Anchors

1. **Color identity:** Monash Blue (`#006CAB`) is primary. White and Monash Blue is the institutional pairing. Neutrals are slate. No generic indigo, no purple.
2. **Execution:** borders over shadows, restrained color (neutral by default), 400 body / 500 emphasized / 600 headings (never bold body), 8px grid, quick subtle hover states.

### Palette — locked in `tailwind.config.ts`

| Token | Hex | Use |
|---|---|---|
| `primary` | `#006CAB` | Buttons, links, active states |
| `primary-hover` | `#005A8F` | Primary button hover |
| `primary-pressed` | `#004875` | Primary button active |
| `primary-subtle` | `#E6F2F8` | Badge backgrounds, gentle tints |
| `surface` | `#FFFFFF` | Card surfaces |
| `surface-elevated` | `#FFFFFF` | Modals, popovers |
| `surface-muted` | `#F8FAFC` | Page background |
| `border-default` | `#E2E8F0` | 1px dividers, default control border |
| `border-strong` | `#CBD5E1` | Hover border (no thickness change) |
| `border-focus` | `#006CAB` | Focus border + ring |
| `text-primary` | `#0F172A` | Primary text |
| `text-secondary` | `#475569` | Secondary text |
| `text-tertiary` | `#94A3B8` | Placeholders, captions |
| `text-on-primary` | `#FFFFFF` | Text on Monash Blue |
| `success` / `success-subtle` | `#059669` / `#D1FAE5` | Success state |
| `warning` / `warning-subtle` | `#D97706` / `#FEF3C7` | Warning state |
| `danger` / `danger-subtle` | `#DC2626` / `#FEE2E2` | Destructive / error |

Backwards-compat aliases (`page`, `ink`, `muted`, `border`, `accent`, `error`, `primary-soft`) are kept temporarily so non-primitive code still compiles. They are removed in Tasks 2 and 3 — do not use them in new code.

### What's banned

- Indigo, purple, pink, teal, green (except `success`)
- Gradients, glassmorphism, neon, dark mode
- Decorative illustrations, animated backgrounds, page-transition animations
- All-caps text outside tiny badge labels
- `shadow-md` outside modals; `shadow-lg` outside dropdowns/popovers
- Bold (`font-bold`) on body copy
- Border-thickness changes on hover (use a darker border instead)
- Arbitrary spacing (`p-[18px]`) — stick to the 8px grid

### Typography

- Sans: Inter 400 / 500 / 600. Mono: JetBrains Mono 400 / 500. Both via Google Fonts.
- Body: 14 / 20 / 400. Body large: 16 / 24 / 400. Small UI: 13 / 18 / 400.
- Headings: H1 24 / 32 / 600 (-0.01em), H2 20 / 28 / 600, H3 16 / 24 / 600. Display 30 / 36 / 600 (-0.02em) for marketing-style hero text only.

### Motion

CSS transitions only. Default `120ms cubic-bezier(0.2, 0, 0, 1)`. Animate color/border/shadow shifts only — never layout, never opacity-only fades.

---

## Conventions

### Components

- All UI primitives live in `components/ui/`. Use `Button` not raw `<button>`.
- Compose with `cn()` from `lib/cn.ts` — no template-string class concatenation.
- Forwarded refs on form primitives.
- `Modal` and `Toast` render through `createPortal` into `document.body`.
- A new component gets props typed as an exported `interface`, not inline.

### Pages

- One file per page in `pages/`. Default layout is `AppShell`.
- Page-level data lives in local `useState` and is fetched in `useEffect` using
  the `api/*` helpers. Don't reach into `client.ts` directly from a page.
- Show `loading` and empty states explicitly. Use `EmptyState` for "nothing
  here yet" affordances and `Skeleton` / `SkeletonText` for loading
  placeholders that mirror the eventual layout.
- Render-time exceptions are caught by the `ErrorBoundary` mounted around
  the routed `<Outlet/>` in `AppShell`. The boundary is keyed on
  `location.pathname`, so navigating away clears a previous failure.

### API calls

- Always go through `api/<module>.ts`. Never call `fetch` from a page or
  component.
- The `apiClient` returns `{ data, meta? }`. `meta` is populated only when the
  backend ships pagination (post-R5). Code should treat `meta` as optional.
- All endpoint helpers throw `ApiError` (with `code`, `status`, `message`). Pages
  catch it and route the message into `useToast().show(msg, 'error')`.

### Auth + RBAC

- `useAuth()` returns `{ user, isAuthenticated, isAdmin, login, register, logout, updateUser }`.
  `updateUser(user)` is called by `AccountPage` after a successful profile
  edit so the TopNav reflects the new name without a re-login.
- `login(email, password, remember?)` and `register(input, remember?)` accept
  an optional `remember` flag. `remember=true` writes the session through
  `persistentTokenStorage` (localStorage); `remember=false` (default) goes
  through `sessionOnlyTokenStorage`. `clearAllAuth()` is invoked on every
  persist + on logout so only one backend ever holds the token.
- Boot order: `AuthProvider` calls `readPreferredAuth()`, which prefers
  localStorage (last "Remember me" choice) and falls back to sessionStorage.
- Protect a route with `<ProtectedRoute requireAdmin />` (the admin variant
  redirects members to `/dashboard`). `/admin/users` lives under such a
  block and the Sidebar conditionally renders the matching link.
- `register(input)` no longer accepts a `role` — self-registration always
  produces a `MEMBER`. Admins promote users via `adminUpdateUser(id, { role })`.
- For inline UI gating, branch on `isAdmin` or compare `user.id` against
  `task.assigneeId` / `task.createdBy` (e.g. status changes for members).

### Adding a new page

1. Create `pages/MyPage.tsx`. Use `<PageHeader title="…" actions={…} />`.
2. Wire the route inside `App.tsx` under the `<AppShell />` block (or as a
   public route at the top level).
3. If it lives in the sidebar, add it to `components/layout/Sidebar.tsx`.

### Adding a new endpoint

1. Add the typed input/output in `api/types.ts` if it's shared.
2. Add the helper in the matching `api/<module>.ts` file.
3. Re-export from `api/index.ts` only if you want a `import { … } from '../api'`
   convenience — pages currently import `import * as taskApi from '../api/tasks'`.

---

## Backend coupling (current state)

- The frontend targets the API as it exists on `main` — R5 (filter/search/
  pagination), R3 (reminder events), and the `/users` listing are all merged.
- Tasks DTOs accept `tags`; the Zod schema persists them.
- The assignee picker is a `<Select>` populated from `useUsers()`. Members see
  themselves only (single-option dropdown); admins see every user. No more
  free-text UUID input.
- `GET /api/v1/audit` is admin-only. The `audit.ts` helper swallows 401/403 and
  returns `[]` so the dashboard degrades gracefully for members.

## Users + assignee dropdown

The frontend resolves assignee IDs into human names through a session-scoped
cache so individual cards never refetch.

- `UsersProvider` wraps the route tree (between `AuthProvider` and
  `ToastProvider` in `App.tsx`). On mount, and whenever `isAuthenticated`
  flips true, it calls `GET /api/v1/users` once and stores the array.
- `useUsers()` exposes:
  - `users` — full array as returned by the API (RBAC-scoped server side)
  - `loading`, `error`, `refresh()`
  - `lookup(id)` — `UserSummary | undefined`
  - `displayName(id, fallback = 'Unassigned')` — string for cards/tables
- The hook is consumed by `TaskFormModal`, `TaskFilters`, `TaskCard`,
  `TasksPage`, `TaskDetailPage`, and `KanbanPage`. Each renders the cached
  list — no per-component fetch.
- When a member logs in, the dropdown collapses to just themselves. This
  matches the backend RBAC scoping and keeps the UX honest.

## Notifications

The notifications surface is owned by `NotificationsProvider` (mounted inside
`UsersProvider` and outside `ToastProvider` in `App.tsx`).

- On mount and on every successful `isAuthenticated` flip, the provider calls
  `Promise.all([listNotifications({ limit: 20 }), getUnreadCount()])` and
  caches both results.
- A `setInterval` refreshes the same pair every 30 s. The interval is cleared
  on unmount or when `isAuthenticated` flips false.
- `markRead(id)` and `markAllRead()` apply the change locally first
  (optimistic) then fire the API call — the badge never lags behind the
  click.
- `NotificationsBell` reads from the hook and triggers `refresh()` on
  popover-open so the panel always reflects the freshest server state. The
  panel is a `role="dialog"` with `aria-label="Notifications"`. The bell
  button's `aria-label` is `"Notifications"` or
  `"Notifications, N unread"` depending on count.

---

## Testing

Frontend tests run on **Vitest** with **jsdom** + **@testing-library/react** and
**@testing-library/jest-dom** matchers. They live in `frontend/tests/`, kept
separate from the backend Jest suite at the repo root (`tests/`).

Layout:

```
frontend/
  tests/
    setup.ts          — global test setup; jest-dom matchers, cleanup, and an
                        in-memory localStorage / sessionStorage shim (vitest's
                        jsdom env supplies a placeholder object whose Storage
                        methods are missing, so the shim is required)
    components/       — UI primitive + feature component tests
    lib/              — pure-helper tests (e.g. tokenStorage)
    pages/            — page-level tests with provider wrappers
  vitest.config.ts    — jsdom env, globals enabled, includes tests/**/*.test.tsx
  tsconfig.test.json  — extends app config; adds vitest/globals + jest-dom types
```

Scripts (from `frontend/`):

- `npm test` — interactive watch mode
- `npm run test:run` — single run (used by CI)
- `npm run test:coverage` — single run with v8 coverage report

Conventions:

- One test file per component, mirroring its `src/` path under `tests/`.
- Use `userEvent` (not `fireEvent`) for interactions.
- Use semantic queries (`getByRole`, `getByLabelText`) over `getByTestId`.
- Mock the `api/*` modules with `vi.mock()` — never hit `fetch` from a test.
- Wrap in routing/context providers locally per test; no shared render helper
  until duplication actually hurts.

CI runs the frontend job in parallel with the backend job: install →
`npm run lint` → `npm run test:run` → `npm run build`.

---

## Outstanding TODOs left for teammates

Search the repo for these markers — they are intentionally small, well-scoped
tickets to keep contribution paths open:

- `TODO(ethan)` — Cypress E2E for the edit-event flow
