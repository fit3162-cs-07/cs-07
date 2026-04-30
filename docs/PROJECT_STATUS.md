# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-30
**Sprint:** Sprint 7 (week beginning Mon 21 Apr 2026)

---

## Recent merges

| PR  | Branch | Scope | Merged |
|-----|--------|-------|--------|
| #1  | `feat/task-filter-search` | R5 — filter / search / pagination + `Tag` and `TaskFilter` value objects | 2026-04-30 |
| #2  | `feat/reminder-module` | R3 backend — `TaskReminderDueEvent`, `CheckDueRemindersUseCase`, `ReminderScheduler` | 2026-04-30 |
| #3  | `feat/frontend-build` | Frontend MVP — design system, router, AuthContext, 7 pages, drag-and-drop Kanban | 2026-04-30 |
| #5  | `feature/users-endpoint` | `/users` listing + assignee dropdown UX (replaces orphaned PR #4) | 2026-04-30 |
| #6  | `feature/dashboard-reminder-widget` | R3 frontend — `UpcomingReminders` card on the dashboard | 2026-04-30 |
| #7  | `feature/account-page` | Self-service account page + `/users/me`, `/users/me/password` endpoints | 2026-04-30 |
| #8  | `feature/frontend-test-harness` | Vitest + jsdom + Testing Library wired in `frontend/`; CI split into backend / frontend jobs | 2026-04-30 |

`main` now contains the complete vertical slice (backend modules + frontend
pages, including assignee dropdown and the reminder widget) and a working
frontend test harness. Smoke-tested locally before each merge.

---

## Truth-in-state notes (read first)

- Backend modules R1, R2, R3, R4, R5, R7 all live on `main`.
- Frontend pages for R1, R2, R4, R5, R7 all live on `main`, plus the assignee
  dropdown wired through `useUsers`.
- `frontend/src/legacy/App.legacy.tsx` is a relocated copy of the original
  single-file demo UI — kept for reference, not mounted, excluded from tsc
  and eslint.
- **Active feature branches in remote:**
  - `feature/loading-and-empty-states` — PR #9, this PR
  - `feature/front-end-set-up-ray` — Ruizhi's active frontend branch
    (login screen + UI work; **do not touch**)
  - `feature/createEvent` — Ethan's; **do not touch**
- **Branch convention:** spell out `feature/` (not `feat/`). The first four
  merged PRs used the short form before the convention update; from PR #5
  onward we use the long form.
- **Stale remote branches removed**: `backend`, `frontend`, `feature/database`,
  `feature/set-up-skeleton`, `feat/users-endpoint`. GitHub default branch is
  now `main`.

---

## RTM Coverage (gap analysis)

| Req | Description | Priority | Status | What's missing | Covering branch / PR |
|-----|-------------|----------|--------|----------------|----------------------|
| R1  | Admin CRUD tasks | High | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R2  | Admin assign tasks to members | High | ✅ On main (backend + frontend) | — | merged (PR #3, #5) |
| R3  | Deadlines and reminders | Medium | ✅ On main (backend + frontend) | Reminder delivery channel (email/push); persistence of "reminded" set across restarts | merged (PR #2, #6) |
| R4  | Kanban status view (ToDo / InProgress / Done) | Medium | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R5  | Categorize / filter / search | Medium | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R6  | File attachments | Low | ❌ Not started | Upload/download/delete endpoints, storage adapter, MIME/size validation | unscheduled |
| R7  | Role-based access control | High | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R8  | Responsive design | Medium | 🚧 Partial | Tailwind theme + responsive grids in place; explicit mobile drawer + breakpoint testing pending | follow-up branch `feature/responsive-polish` |
| R13 | Page load under 3 s | High | ✅ On main | Initial bundle ~295 kB / 92 kB gzipped — well under 3 s on a normal connection | merged (PR #3, #5) |

---

## Backend

### Identity Module — on main (+ PR #7)
- ✅ User entity, Role enum (ADMIN, MEMBER)
- ✅ `IUserRepository` + `InMemoryUserRepository` (with `findAll()`)
- ✅ `RegisterUseCase` (Zod, bcrypt) and `LoginUseCase` (JWT issuance)
- ✅ `GetUsersUseCase` + `GET /api/v1/users` — RBAC-scoped listing for the
  assignee dropdown
- ✅ Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`,
  `GET /api/v1/users`
- ✅ `authMiddleware` (JWT verify) + `requireRole` (RBAC)
- 🚧 (PR #7) `UpdateProfileUseCase` + `ChangePasswordUseCase` →
  `GET /api/v1/users/me`, `PATCH /api/v1/users/me`,
  `POST /api/v1/users/me/password`. Publishes `UserProfileUpdated` and
  `UserPasswordChanged` domain events. Register min password length bumped
  6 → 8 to match the change-password rule (project standard going forward).

### Task Module — on main
- ✅ Task entity, `TaskStatus`, `TaskPriority`
- ✅ `ITaskRepository` + `InMemoryTaskRepository`
- ✅ Use cases: Create, Update, Delete, Assign, ChangeStatus, GetById, GetTasks
- ✅ Domain events: `TaskCreated`, `TaskAssigned`, `TaskStatusChanged`,
  `TaskDeleted`, `TaskReminderDue`
- ✅ Routes: full CRUD + `/assign` + `/status`
- ✅ `Tag` value object, `TaskFilter` value object, `GetTasksUseCase` with
  pagination + RBAC scoping, multi-tag / text / date-range filters
- ✅ `CheckDueRemindersUseCase` + `ReminderScheduler` (node-cron) + audit-logger
  registration of `TaskReminderDue`

### Shared Infrastructure — on main
- ✅ Base `Entity`, `DomainEvent`, `IEventBus` (`NodeEventBus` via EventEmitter)
- ✅ `UseCase` interface
- ✅ `AuditLogger` subscribed to task events; `GET /api/v1/audit` (admin only).
  PR #7 also subscribes `UserProfileUpdated` and `UserPasswordChanged`.
- ✅ Middleware: auth, requireRole, errorHandler, requestLogger
- ✅ `ApiResponse` helpers; standard `{ success, data | error }` envelope
- ✅ Config module (env vars)

### Seed Data — on main
- ✅ 3 users (1 admin, 2 members) and 5 tasks across statuses/priorities

### Not started
- ❌ Reminder delivery channel / notification preferences
- ❌ Club entity / `IClubRepository` (Task already has unused `clubId` field)
- ❌ R6 file attachments
- ❌ `notification/` module (planned next sprint — distinct from audit, listens
  to the same domain events)

---

## Frontend — on main (+ PR #9)

### Foundation
- ✅ Tailwind v3 with the locked palette (Tailwind theme overrides defaults)
- ✅ Inter font + design tokens (`src/design/tokens.ts`)
- ✅ Typed API service layer with JWT injection + envelope-aware error handling
- ✅ `AuthContext` (sessionStorage) + `useAuth` + `ProtectedRoute`. PR #7 adds
  `updateUser(user)` so profile changes flow back into the TopNav.
- ✅ `UsersContext` + `useUsers` (single-fetch session cache)
- ✅ React Router v6 with public + protected routes + 404
- ✅ `AppShell` (top nav + sidebar)
- ✅ UI primitives: `Button`, `Input`, `Textarea`, `Select`, `Field`, `Card`,
  `Badge` (incl. `StatusBadge`/`PriorityBadge`), `Modal`, `Toast`, `Dropdown`,
  `PageHeader`, `EmptyState`. PR #9 adds `Skeleton` / `SkeletonText` and a
  reusable `ErrorBoundary` (mounted per-route in `AppShell`).
- ✅ `useUsers` hook + `UsersContext` — single source of truth for user
  display names across pages

### Pages
- ✅ `LoginPage`, `RegisterPage`, `DashboardPage`, `TasksPage`,
  `TaskDetailPage`, `KanbanPage`, `AccountPage`, `NotFoundPage`
- ✅ `TaskFormModal` (reusable create/edit) with assignee dropdown
- ✅ `UpcomingReminders` card on `DashboardPage` — surfaces tasks due in the
  next 24 hours plus anything overdue from the last 30 days
- 🚧 (PR #9) Skeletons replace text-only "Loading…" states across
  `DashboardPage`, `TasksPage`, `TaskDetailPage`, `KanbanPage`, and
  `UpcomingReminders`. `ErrorBoundary` wraps the routed `<Outlet/>` and
  resets when the path changes, so a render-time exception on one page no
  longer takes down the shell.

### Outstanding (planned this sprint)
- Mobile drawer + breakpoint polish (Task D — closes R8)
- Auth pages polish: validation, password strength, "Remember me",
  forgot-password stub (Task E)
- Admin user management page + RBAC backend tightening (Tasks F1 + F2)
- Notifications module + TopNav bell (Task G)

### Outstanding (intentional, scoped for teammates)
- `TODO(ruizhi)` — login polish + "Remember me"
- `TODO(ethan)` — Cypress E2E for edit-event flow
- `TODO(ethan)` — register-page validation polish (inline errors, password
  strength, debounced uniqueness)

---

## Database

- ✅ In-memory repositories (Map-based, implements repository interfaces)
- ✅ Seed loaded on startup
- ❌ MongoDB / Mongoose schemas, repos, connection setup (planned Sprint 8)
- ❌ Indexes, migration / seed scripts for MongoDB

---

## Testing

- ✅ Backend on main: 15 suites, 90 tests — repo-root `tests/` (Jest +
  Supertest)
- ✅ Frontend on main: 5 suites, 22 tests — Vitest (jsdom + Testing Library +
  jest-dom + user-event) under `frontend/tests/`
- 🚧 (PR #9) Frontend: `Skeleton` (+ `SkeletonText`) and `ErrorBoundary`
  component tests inline (10 new frontend tests).
- ❌ Cypress E2E (owned by Ethan)
- ❌ Coverage reporting in CI

---

## Infrastructure

- ✅ TypeScript strict, ESLint + Prettier, Jest + ts-jest (backend)
- ✅ Vite + React 19 + Tailwind v3 (frontend)
- ✅ GitHub Actions: lint + typecheck + tests
- ✅ Branch protection on `main`
- ✅ Dockerfile + docker-compose.yml (API + MongoDB placeholder)
- ✅ `.env.example`
- ✅ GitHub default branch is `main`; stale skeleton branch deleted
- ❌ Deployment (Azure Container Apps / similar)
- ❌ HTTPS / TLS

---

## Open PRs (Sprint 7)

- **#9** `feature/loading-and-empty-states → main` — Skeleton primitives +
  `ErrorBoundary` wired into pages and the `AppShell` outlet

### Outstanding queue (this contributor)
1. Responsive polish (`feature/responsive-polish`)
2. Auth pages polish + "Remember me" wrappers (`feature/auth-pages-polish`)
3. Admin user management — backend (`feature/admin-users-backend`)
4. Admin user management — frontend (`feature/admin-users-frontend`)
5. Notifications module + bell (`feature/notifications`)

---

## Known issues (carried)

1. `LoginUseCase` imports `config` directly — should inject JWT secret via constructor
2. Error handling uses string matching (`err.message === 'UNAUTHORIZED'`) — should use typed errors
3. Audit route checks role inline instead of reusing `requireRole`
4. `actorRole` in `ChangeTaskStatusUseCase` typed as `string` instead of `Role`
5. `UpdateTaskUseCase` doesn't publish a domain event (other mutations do)
6. `ReminderScheduler` keeps the "already reminded" set in process memory only —
   restarts will re-fire reminders for tasks still in window. Persist to repo
   when MongoDB lands (Sprint 8).

None blocking; tracked for a future cleanup sprint.
