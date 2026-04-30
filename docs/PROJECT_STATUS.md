# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-30
**Sprint:** Sprint 7 (week beginning Mon 21 Apr 2026)

---

## Truth-in-state notes (read first)

- **R5 (filter/search/pagination)** is **merged on `main`** (PR #1, 2026-04-30).
- **R3 (deadlines and reminders)** is **merged on `main`** (PR #2, 2026-04-30):
  `TaskReminderDueEvent`, `CheckDueRemindersUseCase`, `node-cron`-driven
  `ReminderScheduler`, audit-logger registration of `TaskReminderDue`.
- **Frontend MVP** is in progress on **this branch** (`feat/frontend-build`).
  React 19 + Vite + Tailwind, full router + design system + 7 pages. Architecture
  rules in `docs/FRONTEND_ARCHITECTURE.md`.
- **`frontend/src/legacy/App.legacy.tsx`** — the original demo UI was relocated
  here for reference; it is not mounted, excluded from tsc and eslint.
- **Active feature branches in remote:**
  - `feat/frontend-build` — frontend MVP, this PR (Thanh)
  - `feature/front-end-set-up-ray` — Ruizhi's active frontend branch
    (login screen + UI work; **do not touch**)
- **Stale remote branches removed last session**: `backend`, `frontend`,
  `feature/database`. The branch `feature/set-up-skeleton` could not be deleted
  because it is still set as the GitHub repository default branch — flagged for
  the team to flip the default to `main` and prune.

---

## RTM Coverage (gap analysis)

| Req | Description | Priority | Status | What's missing | Covering branch / PR |
|-----|-------------|----------|--------|----------------|----------------------|
| R1  | Admin CRUD tasks | High | ✅ Backend on main · ✅ Frontend on this branch | — | `feat/frontend-build` (this PR) |
| R2  | Admin assign tasks to members | High | ✅ Backend on main · ✅ Frontend (UUID input) | UI picker awaits a `/users` endpoint | `feat/frontend-build` |
| R3  | Deadlines and reminders | Medium | ✅ On main | Reminder delivery channel (email / push); persistence of "reminded" set across restarts | merged (PR #2) |
| R4  | Kanban status view (ToDo / InProgress / Done) | Medium | ✅ Backend on main · ✅ Frontend on this branch | — | `feat/frontend-build` |
| R5  | Categorize / filter / search | Medium | ✅ Backend on main · ✅ Frontend on this branch | — | merged (PR #1) + `feat/frontend-build` |
| R6  | File attachments | Low | ❌ Not started | Upload/download/delete endpoints, storage adapter, MIME/size validation | unscheduled |
| R7  | Role-based access control | High | ✅ Backend on main · ✅ Frontend (route guard + UI gating) | — | `feat/frontend-build` |
| R8  | Responsive design | Medium | 🚧 Partial | AppShell + grids are responsive (md/lg breakpoints); needs review on small screens | `feat/frontend-build` |
| R13 | Page load under 3 s | High | 🚧 Initial bundle 290kB / 91kB gzipped | Code-splitting + image strategy when assets land | future sprint |

---

## Backend

### Identity Module — on main
- ✅ User entity, Role enum (ADMIN, MEMBER)
- ✅ `IUserRepository` + `InMemoryUserRepository`
- ✅ `RegisterUseCase` (Zod, bcrypt) and `LoginUseCase` (JWT issuance)
- ✅ Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- ✅ `authMiddleware` (JWT verify) + `requireRole` (RBAC)

### Task Module — on main
- ✅ Task entity, `TaskStatus`, `TaskPriority`
- ✅ `ITaskRepository` + `InMemoryTaskRepository`
- ✅ Use cases: Create, Update, Delete, Assign, ChangeStatus, GetById, GetTasks
- ✅ Domain events: `TaskCreated`, `TaskAssigned`, `TaskStatusChanged`,
  `TaskDeleted`, `TaskReminderDue`
- ✅ Routes: full CRUD + `/assign` + `/status`
- ✅ `Tag` value object, `TaskFilter` value object, `GetTasksUseCase` with
  pagination + RBAC scoping, multi-tag / text / date-range filters (R5, merged)
- ✅ `CheckDueRemindersUseCase` + `ReminderScheduler` (node-cron) + audit-logger
  registration of `TaskReminderDue` (R3, merged)

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
- ❌ `/users` listing endpoint (frontend assignee picker depends on it)
- ❌ Club entity / `IClubRepository` (Task already has unused `clubId` field)
- ❌ Notification module (delivery channel / preferences)
- ❌ R6 file attachments

---

## Frontend (this PR)

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
- ✅ `LoginPage` — seeded credentials, error surfacing, redirect-to-intended-route
- ✅ `RegisterPage` — name/email/password/role with inline validation, auto-login
- ✅ `DashboardPage` — welcome, three stats (total / due-this-week / in-progress),
  recent tasks, audit feed for admins
- ✅ `TasksPage` — filter sidebar + table view + pagination (page meta optional)
- ✅ `TaskDetailPage` — full detail card, admin actions, status quick-action,
  per-task audit feed for admins
- ✅ `KanbanPage` — three columns with `@dnd-kit` drag-and-drop, RBAC-scoped
  drag (admin can move any; member only own/assigned), filter bar, optimistic
  status update with rollback on failure
- ✅ `TaskFormModal` — reusable create/edit; status + assignee changes route
  through their dedicated endpoints
- ✅ `NotFoundPage`

### Verified
- ✅ `npm run build` (tsc + vite) clean — 290 kB / 91 kB gzipped initial bundle
- ✅ `npm run lint` clean
- ✅ `npm run dev` boots on :5173, serves `index.html` 200
- ⚠️ Browser smoke-test against the running backend not yet performed in this
  session — golden-path E2E pending

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

- ✅ Main: 10 suites, 68 tests (post-R3 + R5 merge)
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
- ⚠️ GitHub default branch is still `feature/set-up-skeleton` — should be flipped
  to `main` so PRs default correctly and the stale branch can be pruned
- ❌ Deployment (Azure Container Apps / similar)
- ❌ HTTPS / TLS

---

## Open PRs (Sprint 7)

- ~~**#1** `feat/task-filter-search → main` — R5 (filter/search/pagination)~~ ✅ merged
- ~~**#2** `feat/reminder-module → main` — R3 (cron + reminder events)~~ ✅ merged
- **#3** `feat/frontend-build → main` — full frontend MVP (this PR)

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
7. Frontend assignee picker is a free-text UUID field — depends on a `/users`
   listing endpoint that the backend does not yet expose.

None blocking; tracked for a future cleanup sprint.
