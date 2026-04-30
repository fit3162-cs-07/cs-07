# Frontend Architecture

**Last updated:** 2026-04-30 (rev 2)

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
  users.ts        —   list users (RBAC-scoped server side)
  audit.ts        —   audit log (admin only, gracefully empty otherwise)
  types.ts        —   User, UserSummary, Task, AuditEntry, TaskFilterInput, …
  index.ts        —   barrel re-exports

contexts/
  AuthContext.tsx —   AuthProvider, AuthContext, persists session in sessionStorage
  UsersContext.tsx —  UsersProvider — fetches /users once per session, exposes
                      `{ users, loading, error, refresh, lookup, displayName }`

hooks/
  useAuth.ts      —   wraps AuthContext (throws if used outside Provider)
  useUsers.ts     —   wraps UsersContext (throws if used outside Provider)
  useToast.ts     —   wraps ToastContext

design/
  tokens.ts       —   typed exports of palette, spacing, type, radius, shadows

lib/
  cn.ts           —   `clsx` wrapper used by every component
  format.ts       —   formatDate, formatDateTime, daysUntil, relativeDeadline

components/
  ProtectedRoute.tsx — redirects unauthenticated users to /login (preserves intended path)
  layout/
    AppShell.tsx     — TopNav + Sidebar + <Outlet/>
    TopNav.tsx       — logo + user menu
    Sidebar.tsx      — Dashboard / Tasks / Kanban
  dashboard/
    UpcomingReminders.tsx — R3 surfacing widget for the dashboard
  ui/
    Button, Input, Textarea, Select, Field, Card, Badge,
    Modal, Toast, Dropdown, PageHeader, EmptyState

features/
  tasks/
    TaskCard.tsx       — `list` and `compact` variants
    TaskFilters.tsx    — `sidebar` and `bar` layouts
    TaskFormModal.tsx  — reusable create/edit modal

pages/
  LoginPage, RegisterPage, DashboardPage,
  TasksPage, TaskDetailPage, KanbanPage, NotFoundPage

legacy/
  App.legacy.tsx + api.legacy.ts — original single-file demo, NOT mounted,
  excluded from tsc + eslint, kept only as reference for teammates
```

---

## Design system rules (NON-NEGOTIABLE)

### Palette — locked in `tailwind.config.ts`

| Token            | Hex      | Use                                   |
|------------------|----------|---------------------------------------|
| `primary`        | #1E40AF  | Buttons, links, active states         |
| `primary-hover`  | #1D4ED8  | Primary button hover                  |
| `primary-soft`   | #EFF6FF  | Subtle section backgrounds, hover     |
| `accent`         | #3B82F6  | Focus rings, highlights               |
| `surface`        | #FFFFFF  | Card surfaces                         |
| `page`           | #F8FAFC  | Page background                       |
| `ink`            | #0F172A  | Primary text                          |
| `muted`          | #64748B  | Secondary text, captions              |
| `border`         | #E2E8F0  | 1px dividers                          |
| `success`        | #059669  | Status badges only                    |
| `error`          | #DC2626  | Validation errors, danger buttons     |
| `warning`        | #D97706  | Due-date alerts only                  |

The Tailwind theme **overrides** the default colour palette — no stray
purple/pink/teal/green class will compile. If you need a colour, it must be in
the table above. Same goes for spacing (4/8/12/16/24/32/48 only) and font sizes.

### What's banned

- Purple, pink, teal, green (except `success`)
- Gradients, glassmorphism, neon, dark mode
- Decorative illustrations, animated backgrounds
- All-caps text outside tiny badge labels
- `shadow-md`, `shadow-lg`, `shadow-2xl` (only `shadow-sm`)
- Border radius beyond 8px (`rounded-sm`, `rounded-md`, `rounded-lg`)

### Typography

- Font: Inter (loaded once in `index.css`)
- Body: 14–15px, weight 400, line-height 1.5
- Headings: weight 600, line-height 1.25–1.5

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
  here yet" affordances.

### API calls

- Always go through `api/<module>.ts`. Never call `fetch` from a page or
  component.
- The `apiClient` returns `{ data, meta? }`. `meta` is populated only when the
  backend ships pagination (post-R5). Code should treat `meta` as optional.
- All endpoint helpers throw `ApiError` (with `code`, `status`, `message`). Pages
  catch it and route the message into `useToast().show(msg, 'error')`.

### Auth + RBAC

- `useAuth()` returns `{ user, isAuthenticated, isAdmin, login, register, logout }`.
- Protect a route with `<ProtectedRoute requireAdmin />` (the admin variant
  redirects members to `/dashboard`).
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

---

## Testing

Frontend tests run on **Vitest** with **jsdom** + **@testing-library/react** and
**@testing-library/jest-dom** matchers. They live in `frontend/tests/`, kept
separate from the backend Jest suite at the repo root (`tests/`).

Layout:

```
frontend/
  tests/
    setup.ts          — global test setup; imports jest-dom matchers + cleanup
    components/       — UI primitive + feature component tests
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

- `TODO(ruizhi)` — login page polish (animations, "Remember me")
- `TODO(ethan)` — Cypress E2E for the edit-event flow
- `TODO(ethan)` — register-page validation polish (inline errors, password
  strength, debounced uniqueness check)
