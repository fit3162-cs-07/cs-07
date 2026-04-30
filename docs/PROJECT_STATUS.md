# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-19
**Sprint:** Sprint 7 (week beginning Mon 21 Apr 2026)

---

## Truth-in-state notes (read first)

- **R5 (filter/search/pagination) is NOT yet on `main`.** The work is complete on
  branch `feat/task-filter-search` and is awaiting PR review/merge.
- **`frontend/src/App.tsx` currently contains a demo UI** (login form, Kanban board,
  task cards, modal, toast) that was committed during the initial scaffold. It is
  **not** Ruizhi's work — it predates her sprint. Decision on whether to extend or
  replace it sits with Ruizhi when her PR lands.
- **Active feature branches in remote:**
  - `feat/task-filter-search` — R5, awaiting merge (Thanh)
  - `feature/front-end-set-up-ray` — Ruizhi's active frontend branch (login screen
    + UI work; **do not touch**)
- **Stale remote branches removed this sprint** (all were at-or-behind `main` with
  no unique commits): `backend`, `frontend`, `feature/database`, `feature/set-up-skeleton`.

---

## RTM Coverage (gap analysis)

| Req | Description | Priority | Status | What's missing | Covering branch / PR |
|-----|-------------|----------|--------|----------------|----------------------|
| R1  | Admin CRUD tasks | High | ✅ On main | — | merged |
| R2  | Admin assign tasks to members | High | ✅ On main | — | merged |
| R3  | Deadlines and reminders | Medium | 🚧 In progress | `TaskReminderDueEvent`, `CheckDueRemindersUseCase`, `node-cron` scheduler, audit hookup | `feat/reminder-module` |
| R4  | Kanban status view (ToDo / InProgress / Done) | Medium | 🚧 Backend complete; frontend pending | None on backend — `PATCH /tasks/:id/status` plus `GET /tasks?status=...` already cover column-move and column-load. Frontend Kanban rendering owned by Ruizhi/Ethan. | frontend track |
| R5  | Categorize / filter / search | Medium | 🚧 PR pending | Code complete; awaiting review of `feat/task-filter-search` | `feat/task-filter-search` |
| R6  | File attachments | Low | ❌ Not started | Upload/download/delete endpoints, storage adapter, MIME/size validation | unscheduled |
| R7  | Role-based access control | High | ✅ On main | — | merged |
| R8  | Responsive design | Medium | ❌ Frontend concern | Layout, breakpoints, touch targets | `feature/front-end-set-up-ray` |
| R13 | Page load under 3 s | High | ❌ N/A until frontend ships | Lighthouse budget, code-splitting, image strategy | future sprint |

---

## Backend

### Identity Module — on main
- ✅ User entity, Role enum (ADMIN, MEMBER)
- ✅ `IUserRepository` + `InMemoryUserRepository`
- ✅ `RegisterUseCase` (Zod, bcrypt) and `LoginUseCase` (JWT issuance)
- ✅ Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- ✅ `authMiddleware` (JWT verify) + `requireRole` (RBAC)

### Task Module — partially on main
- ✅ Task entity (title, description, status, priority, assigneeId, dueDate, createdBy, clubId, tags)
- ✅ `TaskStatus`, `TaskPriority` enums
- ✅ `ITaskRepository` + `InMemoryTaskRepository`
- ✅ Use cases: Create, Update, Delete, Assign, ChangeStatus, GetById
- ✅ Domain events: `TaskCreated`, `TaskAssigned`, `TaskStatusChanged`, `TaskDeleted`
- ✅ Routes: full CRUD + `/assign` + `/status`
- 🚧 (on `feat/task-filter-search`, awaiting merge) `Tag` value object, `TaskFilter` value object, `GetTasksUseCase` with pagination + RBAC scoping, multi-tag/text/date-range filters
- 🚧 (on `feat/reminder-module`, in progress) `TaskReminderDueEvent`, `CheckDueRemindersUseCase`, cron scheduler

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
- ❌ Club entity / `IClubRepository` (Task already has unused `clubId` field)
- ❌ Notification module (delivery / preferences)
- ❌ R6 file attachments

---

## Frontend

- 🚧 Vite + React + TypeScript scaffold in `frontend/`
- 🚧 `frontend/src/App.tsx` contains a single-file demo UI (login form, Kanban,
  task cards, modal, filter, toast) committed during initial scaffold — **demo
  only, not the production frontend**
- ❌ Production-grade login (owned by Ruizhi on `feature/front-end-set-up-ray`)
- ❌ Edit-event screen + Cypress E2E (owned by Ethan)
- ❌ React Router setup, layout shell, shared components, auth context
- ❌ Drag-and-drop Kanban
- ❌ Responsive design

---

## Database

- ✅ In-memory repositories (Map-based, implements repository interfaces)
- ✅ Seed loaded on startup
- ❌ MongoDB / Mongoose schemas, repos, connection setup (planned Sprint 8)
- ❌ Indexes, migration / seed scripts for MongoDB

---

## Testing

- ✅ 9 test suites, 61 tests — all passing on `feat/task-filter-search`
- ✅ Unit: Task entity, Tag VO, TaskFilter VO, GetTasksUseCase, CreateTaskUseCase, LoginUseCase, EventBus
- ✅ Integration: auth routes (6), task routes (18 — CRUD, filter, search, pagination, RBAC)
- 🚧 (on `feat/reminder-module`) Unit tests for `CheckDueRemindersUseCase`
- ❌ Cypress E2E (owned by Ethan)
- ❌ Coverage reporting in CI

---

## Infrastructure

- ✅ TypeScript strict, ESLint + Prettier, Jest + ts-jest
- ✅ GitHub Actions: lint + typecheck + tests
- ✅ Branch protection on `main`
- ✅ Dockerfile + docker-compose.yml (API + MongoDB placeholder)
- ✅ `.env.example`
- ❌ Deployment (Azure Container Apps / similar)
- ❌ HTTPS / TLS

---

## Sprint 7 plan (week of Mon 21 Apr)

| Owner | Branch | Scope |
|-------|--------|-------|
| Thanh | `feat/task-filter-search` | Land R5 PR |
| Thanh | `feat/reminder-module` | R3 reminder scaffold (events + use case + cron + tests) |
| Ruizhi | `feature/front-end-set-up-ray` | Login screen + UI work |
| Ethan | (TBC) | Code integration, edit-event screen, Cypress setup |

---

## Known issues (carried)

1. `LoginUseCase` imports `config` directly — should inject JWT secret via constructor
2. Error handling uses string matching (`err.message === 'UNAUTHORIZED'`) — should use typed errors
3. Audit route checks role inline instead of reusing `requireRole`
4. `actorRole` in `ChangeTaskStatusUseCase` typed as `string` instead of `Role`
5. `UpdateTaskUseCase` doesn't publish a domain event (other mutations do)

None blocking; tracked for a future cleanup sprint.
