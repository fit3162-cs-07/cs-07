# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-30 (rev — Sprint 8 design pass kicks off, PR #16 design tokens)
**Sprint:** Sprint 8 (week beginning Mon 28 Apr 2026)

> **Sprint 8 — design pass.** Six sequential PRs rebuild the UI on Monash Blue
> tokens with Linear-style craft. PR #16 (this PR) lands the foundation:
> tokens, primitives, `STYLE_GUIDE.md`, and a `/design/preview` page. Visual
> changes only land progressively in PRs #17–#21 as shell, pages, components,
> polish, and mobile follow.

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
  - `feature/loading-and-empty-states` — PR #9 (Skeleton + ErrorBoundary)
  - `feature/responsive-polish` — PR #10 (mobile drawer +
    PageHeader stacking + collapsible filters)
  - `feature/auth-pages-polish` — PR #11, this PR (Remember me, password
    show/hide, password strength meter, persistent / session token storage)
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
| R8  | Responsive design | Medium | 🚧 Mobile drawer landed in PR #10; smoke-testing on real devices pending | Manual QA on iPhone-class viewport | in flight (PR #10) |
| R13 | Page load under 3 s | High | ✅ On main | Initial bundle ~295 kB / 92 kB gzipped — well under 3 s on a normal connection | merged (PR #3, #5) |

---

## Backend

### Identity Module — on main (+ PR #7)
- ✅ User entity, Role enum (ADMIN, MEMBER). PR #12 adds `isActive: boolean`
  (defaults true).
- ✅ `IUserRepository` + `InMemoryUserRepository` (with `findAll()`)
- ✅ `RegisterUseCase` (Zod, bcrypt) and `LoginUseCase` (JWT issuance).
  PR #12 locks self-registration to `MEMBER` (any incoming `role` field is
  silently dropped) and makes `LoginUseCase` reject deactivated users with
  `ACCOUNT_DEACTIVATED` (HTTP 403). Admins are now created exclusively via
  the seed or by an existing admin via `PATCH /api/v1/users/:id`.
- ✅ `GetUsersUseCase` + `GET /api/v1/users` — RBAC-scoped listing for the
  assignee dropdown. PR #12 widens `UserSummaryDTO` with `isActive`.
- ✅ Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`,
  `GET /api/v1/users`
- ✅ `authMiddleware` (JWT verify) + `requireRole` (RBAC)
- 🚧 (PR #7) `UpdateProfileUseCase` + `ChangePasswordUseCase` →
  `GET /api/v1/users/me`, `PATCH /api/v1/users/me`,
  `POST /api/v1/users/me/password`. Publishes `UserProfileUpdated` and
  `UserPasswordChanged` domain events. Register min password length bumped
  6 → 8 to match the change-password rule (project standard going forward).
- 🚧 (PR #12) `UpdateUserUseCase` (admin-only, name + role) →
  `PATCH /api/v1/users/:id`. `SetUserActiveUseCase` (admin-only) →
  `POST /api/v1/users/:id/deactivate` and `/activate`. Publishes
  `UserRoleChanged` and `UserStatusChanged` domain events. Admins cannot
  change their own role or deactivate themselves (would be unrecoverable
  without DB access).

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
  PR #7 also subscribes `UserProfileUpdated` and `UserPasswordChanged`. PR #12
  adds `UserRoleChanged` and `UserStatusChanged`.
- ✅ Middleware: auth, requireRole, errorHandler, requestLogger
- ✅ `ApiResponse` helpers; standard `{ success, data | error }` envelope
- ✅ Config module (env vars)

### Seed Data — on main
- ✅ 3 users (1 admin, 2 members) and 5 tasks across statuses/priorities

### Not started
- ❌ Reminder delivery channel (email/push) / notification preferences
- ❌ Club entity / `IClubRepository` (Task already has unused `clubId` field)
- ❌ R6 file attachments

### Notification Module — 🚧 PR #14
- ✅ `Notification` entity, `NotificationType` enum (TASK_ASSIGNED,
  TASK_REMINDER_DUE, TASK_STATUS_CHANGED)
- ✅ `INotificationRepository` + `InMemoryNotificationRepository`
  (`findByUser` with `unreadOnly` + `limit`; newest-first ordering;
  `countUnread`; `markAllRead` returns count)
- ✅ Use cases: Create, List, MarkRead (with `FORBIDDEN` for cross-user),
  MarkAllRead, GetUnreadCount
- ✅ `NotificationCreatedEvent` → audit-logger registered
- ✅ `NotificationEventSubscriber` listens to `TaskCreated` + `TaskAssigned` +
  `TaskReminderDue` + `TaskStatusChanged`. Skips self-notifications when
  `event.actor === assigneeId`.
- ✅ Routes: `GET /api/v1/notifications` (with `unreadOnly`, `limit` query
  params, capped 1–100), `GET /unread-count`, `POST /:id/read`,
  `POST /read-all`. All gated by `authMiddleware`.

---

## Frontend — on main (+ PR #9)

### Foundation
- ✅ Tailwind v3 with the locked palette (Tailwind theme overrides defaults)
- ✅ Inter font + design tokens (`src/design/tokens.ts`)
- ✅ Typed API service layer with JWT injection + envelope-aware error handling
- ✅ `AuthContext` + `useAuth` + `ProtectedRoute`. PR #7 adds
  `updateUser(user)` so profile changes flow back into the TopNav. PR #11
  swaps the inline `sessionStorage` reads for a `tokenStorage` abstraction
  and adds a `remember?: boolean` flag to `login` / `register` — `true`
  persists to `localStorage`, `false` keeps the session-only behaviour.
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
- 🚧 (PR #11) `LoginPage` gains "Remember me", inline password show/hide,
  and a "Forgot password?" stub (toast). `RegisterPage` adds inline
  field-level validation, `scorePassword` (extracted to
  `src/lib/passwordStrength.ts`) drives a three-segment strength meter,
  plus the same show/hide + Remember-me controls. Both pages render
  `role="alert"` on a failed submit.
- 🚧 (PR #13) Register form drops the role select (server-side hardening
  in PR #12 means self-registration is always `MEMBER`). New
  `AdminUsersPage` at `/admin/users` (admin-only route) lists every user
  with edit (name + role), deactivate, and activate actions backed by the
  `/users/:id` admin endpoints. Sidebar conditionally shows the "User
  Management" link for admins. Self-protection rules surface in the UI:
  the role select is disabled when editing yourself, the Deactivate button
  is disabled on your own row.

### Outstanding (planned this sprint)
- (none — Tasks C / D / E / F1 / F2 / G all merged or in flight)

### Notifications frontend — 🚧 PR #14
- ✅ `api/notifications.ts` typed helpers
- ✅ `NotificationsContext` + `NotificationsProvider` — polls every 30 s,
  optimistic local updates on read
- ✅ `useNotifications()` hook
- ✅ `NotificationsBell` in `TopNav` — badge capped at "99+", popover with
  empty/loading states, "Mark all read" only when unread > 0, click-outside
  + Escape dismissal, row click marks read and navigates to `n.link`

### Outstanding (intentional, scoped for teammates)
- `TODO(ethan)` — Cypress E2E for edit-event flow

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
- ✅ Frontend on main: Vitest (jsdom + Testing Library + jest-dom +
  user-event) under `frontend/tests/`
- 🚧 (PR #9) Frontend: `Skeleton` (+ `SkeletonText`) and `ErrorBoundary`
  component tests inline (10 new frontend tests).
- 🚧 (PR #10) Frontend: `Sidebar`, `TopNav`, and `PageHeader` component
  tests inline (13 new frontend tests covering the mobile drawer, ESC /
  backdrop close, and responsive header markup).
- 🚧 (PR #11) Frontend: `tokenStorage`, `LoginPage`, `RegisterPage` tests
  inline (25 new frontend tests covering remember-me persistence,
  password show/hide toggle, password-strength scoring, inline validation,
  and the `role="alert"` failure path). Test setup grew an in-memory
  `localStorage` / `sessionStorage` shim because vitest's jsdom env
  supplies a placeholder object whose Storage methods are missing.
- 🚧 (PR #12) Backend: `UpdateUserUseCase` + `SetUserActiveUseCase` unit
  tests plus integration coverage of `PATCH /users/:id`,
  `/users/:id/(de)activate`, and the deactivated-login path. Brings the
  backend suite to **17 suites / 112 tests**.
- 🚧 (PR #13) Frontend: `AdminUsersPage` test (9 tests covering table
  render, self-marker, disabled self-deactivate, edit-modal save, role
  select disabled on self, deactivate confirm flow, reactivate flow,
  empty + error states) and 2 extra `Sidebar` tests for the admin-only
  link visibility.
- 🚧 (PR #14) Backend: 9 new tests across the notification module
  (`CreateNotificationUseCase`, `MarkNotificationReadUseCase`,
  `InMemoryNotificationRepository`) + 8 integration tests at
  `tests/integration/notifications.test.ts`. Backend now: **19 suites,
  129 tests passing.**
- 🚧 (PR #14) Frontend: 10 `NotificationsBell` component tests
  (badge thresholds, panel toggle + refresh, empty/loading state, mark read
  on row click, no-op when already read, mark-all-read visibility, Escape
  closes panel).
- 🚧 (PR #16) Sprint 8 design tokens — no test additions or removals. All
  91 frontend tests and 21 backend suites / 129 tests still green; primitive
  APIs preserved so existing component tests unchanged.
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

- **#14** `feature/notifications → main` — Notification module (backend
  domain + use cases + repo + event subscriber + 4 endpoints) and frontend
  (`NotificationsContext`, `useNotifications`, `NotificationsBell` mounted
  in `TopNav`, 30 s polling)

### Outstanding queue (this contributor)
- (sprint queue clear; next planned: MongoDB persistence + reminder delivery
  channel for Sprint 8)

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
