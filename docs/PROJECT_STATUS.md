# Project Status — Monash Club Task Manager

**Last updated:** 2026-04-12

---

## Backend

### Identity Module
- ✅ User entity (id, email, name, passwordHash, role)
- ✅ Role enum (ADMIN, MEMBER)
- ✅ IUserRepository interface + InMemoryUserRepository
- ✅ RegisterUseCase (Zod validation, bcrypt hashing)
- ✅ LoginUseCase (credential verification, JWT issuance)
- ✅ Auth routes: `POST /register`, `POST /login`
- ✅ authMiddleware (JWT verification)
- ✅ requireRole middleware (RBAC)

### Task Module
- ✅ Task entity (title, description, status, priority, assigneeId, dueDate, createdBy, clubId)
- ✅ TaskStatus enum (TODO, IN_PROGRESS, DONE)
- ✅ TaskPriority enum (LOW, MEDIUM, HIGH)
- ✅ ITaskRepository interface + InMemoryTaskRepository
- ✅ CreateTaskUseCase + TaskCreatedEvent
- ✅ UpdateTaskUseCase (no domain event — see Known Issues)
- ✅ DeleteTaskUseCase + TaskDeletedEvent
- ✅ AssignTaskUseCase + TaskAssignedEvent
- ✅ ChangeTaskStatusUseCase + TaskStatusChangedEvent
- ✅ GetTasksUseCase (filters: status, priority, assigneeId)
- ✅ GetTaskByIdUseCase
- ✅ Task routes: full CRUD + assign + status change

### Shared Infrastructure
- ✅ Base Entity class (id, createdAt, updatedAt)
- ✅ DomainEvent interface + EventBus (NodeEventBus via EventEmitter)
- ✅ UseCase interface
- ✅ AuditLogger (subscribes to events, stores audit trail)
- ✅ Audit route: `GET /api/v1/audit` (admin only)
- ✅ ApiResponse helpers (standard response envelope)
- ✅ Error handler middleware
- ✅ Request logger middleware
- ✅ Config module (env vars)

### Seed Data
- ✅ 3 pre-seeded users (1 admin, 2 members)
- ✅ 5 pre-seeded tasks (various statuses/priorities)

### Club/Event Module
- ❌ Club entity (id, name, description, members)
- ❌ IClubRepository interface + implementation
- ❌ Club CRUD use cases and routes
- ❌ Link tasks to clubs (clubId field exists on Task but unused)

### Notification Module
- ❌ Notification entity
- ❌ Reminder logic for approaching deadlines
- ❌ Email or in-app notification delivery
- ❌ Notification preferences

---

## Frontend

- 🚧 Vite + React + TypeScript scaffold created (`frontend/`)
- ❌ Login page
- ❌ Kanban board UI
- ❌ Task cards / detail view
- ❌ Admin panel (create/edit/delete/assign tasks)
- ❌ Responsive design
- ❌ Connected to backend API

---

## Database

- ✅ In-memory repositories (Map-based, implements repository interfaces)
- ✅ Seed data loaded on startup
- ❌ MongoDB / Mongoose schemas
- ❌ MongoDB repository implementations
- ❌ Database connection setup
- ❌ Indexes
- ❌ Migration / seed scripts for MongoDB

---

## Testing

- ✅ 6 test suites, 21 tests — all passing
- ✅ Unit: Task entity (5 tests)
- ✅ Unit: CreateTaskUseCase (2 tests)
- ✅ Unit: LoginUseCase (3 tests)
- ✅ Unit: EventBus (1 test)
- ✅ Integration: Auth routes (6 tests)
- ✅ Integration: Task routes (4 tests)
- ❌ E2E tests
- ❌ Test coverage reporting configured

---

## Infrastructure

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Jest + ts-jest
- ✅ GitHub Actions CI pipeline
- ✅ Dockerfile
- ✅ docker-compose.yml (API + MongoDB placeholder)
- ✅ .env.example
- ❌ Deployed to Azure Container Apps
- ❌ Production environment configured
- ❌ HTTPS / TLS setup

---

## RTM Coverage

| Req | Description | Priority | Status |
|-----|-------------|----------|--------|
| R1 | Admin CRUD tasks | High | ✅ Done |
| R2 | Admin assign tasks to members | High | ✅ Done |
| R3 | Deadlines and reminders | Medium | 🚧 Partial — dueDate stored, no reminder logic |
| R4 | Kanban status view (ToDo/InProgress/Done) | Medium | 🚧 Backend done, needs frontend |
| R5 | Categorize/filter/search tasks | Medium | 🚧 Partial — filters done, no full-text search or tags |
| R6 | File attachments | Low | ❌ Not started |
| R7 | Role-based access control | High | ✅ Done |
| R8 | Responsive design | Medium | ❌ Not started (no frontend yet) |
| R13 | Page load under 3 seconds | High | ❌ N/A until frontend exists |

---

## Known Issues

1. **LoginUseCase** imports `config` directly — should inject JWT secret via constructor (onion architecture violation)
2. **Error handling** uses string matching (`err.message === 'UNAUTHORIZED'`) — should use custom error classes
3. **Audit route** checks role inline instead of reusing `requireRole` middleware
4. **`actorRole`** in ChangeTaskStatusUseCase is typed as `string` instead of `Role` enum
5. **UpdateTaskUseCase** doesn't publish a domain event (other mutations do)

None of these are blocking — all are minor improvements for a future sprint.
