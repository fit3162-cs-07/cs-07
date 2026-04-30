# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-30
**Sprint:** Sprint 7 (week beginning Mon 21 Apr 2026)

---

## Recent merges

| PR  | Branch | Scope | Merged |
|-----|--------|-------|--------|
| #1  | `feat/task-filter-search` | R5 — filter / search / pagination + `Tag` and `TaskFilter` value objects | 2026-04-30 |
| #2  | `feat/reminder-module` | R3 — `TaskReminderDueEvent`, `CheckDueRemindersUseCase`, `node-cron` `ReminderScheduler` | 2026-04-30 |
| #3  | `feat/frontend-build` | Frontend MVP — design system, router, AuthContext, 7 pages, drag-and-drop Kanban | 2026-04-30 |

`main` now contains the complete vertical slice (backend modules + frontend
pages). Smoke-tested locally before each merge.

---

## Truth-in-state notes (read first)

- Backend modules R1, R2, R3, R4, R5, R7 all live on `main`.
- Frontend pages for R1, R2, R4, R5, R7 all live on `main`.
- `frontend/src/legacy/App.legacy.tsx` is a relocated copy of the original
  single-file demo UI — kept for reference, not mounted, excluded from tsc
  and eslint.
- **Active feature branches in remote:**
  - `feat/users-endpoint` — `/users` listing + assignee dropdown UX (this PR)
  - `feature/front-end-set-up-ray` — Ruizhi's active frontend branch
    (login screen + UI work; **do not touch**)
  - `feature/createEvent` — appears to be Ethan's; **do not touch**
- **Stale remote branches removed**: `backend`, `frontend`, `feature/database`,
  `feature/set-up-skeleton`. GitHub default branch is now `main`.

---

## RTM Coverage (gap analysis)

| Req | Description | Priority | Status | What's missing | Covering branch / PR |
|-----|-------------|----------|--------|----------------|----------------------|
| R1  | Admin CRUD tasks | High | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R2  | Admin assign tasks to members | High | ✅ On main (backend + frontend) | Assignee picker still takes a UUID — dropdown UX coming via PR #4 | merged (PR #3); UX in `feat/users-endpoint` |
| R3  | Deadlines and reminders | Medium | ✅ Backend on main | Dashboard widget that surfaces upcoming reminders to the user; reminder delivery channel (email/push); persistence of "reminded" set across restarts | merged (PR #2) |
| R4  | Kanban status view (ToDo / InProgress / Done) | Medium | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R5  | Categorize / filter / search | Medium | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R6  | File attachments | Low | ❌ Not started | Upload/download/delete endpoints, storage adapter, MIME/size validation | unscheduled |
| R7  | Role-based access control | High | ✅ On main (backend + frontend) | — | merged (PR #1, #3) |
| R8  | Responsive design | Medium | 🚧 Partial | Tailwind theme + responsive grids in place; explicit mobile testing not yet done | follow-up |
| R13 | Page load under 3 s | High | ✅ On main | Initial bundle 290 kB / 91 kB gzipped — well under 3 s on a normal connection | merged (PR #3) |

---

## Backend

### Identity Module — on main
- ✅ User entity, Role enum (ADMIN, MEMBER)
- ✅ `IUserRepository` + `InMemoryUserRepository` (with `findAll()`)
- ✅ `RegisterUseCase` (Zod, bcrypt) and `LoginUseCase` (JWT issuance)
- ✅ Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- ✅ `authMiddleware` (JWT verify) + `requireRole` (RBAC)
- 🚧 (this PR) `GetUsersUseCase` + `GET /api/v1/users` — RBAC-scoped listing
  for the assignee dropdown

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
- ✅ `AuditLogger` subscribed to task events; `GET /api/v1/audit` (admin only)
- ✅ Middleware: auth, requireRole, errorHandler, requestLogger
- ✅ `ApiResponse` helpers; standard `{ success, data | error }` envelope
- ✅ Config module (env vars)

### Seed Data — on main
- ✅ 3 users (1 admin, 2 members) and 5 tasks across statuses/priorities

### Not started
- ❌ Reminder delivery channel / notification preferences
- ❌ Club entity / `IClubRepository` (Task already has unused `clubId` field)
- ❌ R6 file attachments

---

## Frontend — on main

### Foundation
- ✅ Tailwind v3 with the locked palette (Tailwind theme overrides defaults)
- ✅ Inter font + design tokens (`src/design/tokens.ts`)
- ✅ Typed API service layer with JWT injection + envelope-aware error handling
- ✅ `AuthContext` (sessionStorage) + `useAuth` + `ProtectedRoute`
- ✅ React Router v6 with public + protected routes + 404
- ✅ `AppShell` (top nav + sidebar)
- ✅ UI primitives: `Button`, `Input`, `Textarea`, `Select`, `Field`, `Card`,
  `Badge` (incl. `StatusBadge`/`PriorityBadge`), `Modal`, `Toast`, `Dropdown`,
  `PageHeader`, `EmptyState`

### Pages
- ✅ `LoginPage`, `RegisterPage`, `DashboardPage`, `TasksPage`,
  `TaskDetailPage`, `KanbanPage`, `NotFoundPage`
- ✅ `TaskFormModal` (reusable create/edit)

### In progress (this PR)
- 🚧 `useUsers` hook + assignee dropdown — replaces UUID free-text inputs in
  `TaskFormModal` and `TasksPage` filter sidebar; resolves IDs to display
  names in the task table and Kanban cards

### Outstanding (intentional, scoped for teammates)
- `TODO(ruizhi)` — login polish + "Remember me"
- `TODO(ethan)` — Cypress E2E for edit-event flow
- `TODO(ethan)` — register-page validation polish (inline errors, password
  strength, debounced uniqueness)
- Reminder dashboard widget (R3 frontend surfacing) — follow-up

---

## Database

- ✅ In-memory repositories (Map-based, implements repository interfaces)
- ✅ Seed loaded on startup
- ❌ MongoDB / Mongoose schemas, repos, connection setup (planned Sprint 8)
- ❌ Indexes, migration / seed scripts for MongoDB

---

## Testing

- ✅ Backend: 10 suites, 68 tests (post-R3 + R5 merge)
- 🚧 (this PR) Add unit + integration tests for `GetUsersUseCase`
- ❌ Frontend unit tests (deferred — Vitest not yet wired)
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
- ✅ GitHub default branch is now `main`; stale skeleton branch deleted
- ❌ Deployment (Azure Container Apps / similar)
- ❌ HTTPS / TLS

---

## Open PRs (Sprint 7)

- **#4** `feat/users-endpoint → main` — `/users` listing + assignee dropdown UX

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
