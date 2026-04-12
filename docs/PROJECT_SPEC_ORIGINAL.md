# CLAUDE.md — Project Context for Claude Code

## Project Overview

This is the **Monash Club Task Management Application** — a capstone project for FIT3162 Computer Science Project Part 2 at Monash University. The application helps Monash University clubs plan, assign, track, and review tasks for events and activities.

**Team:** 3 students (Thanh Tung Le, Ruizhi Wang, Ethan Arsabhuvana) — Group S2_CS_07
**Timeline:** 12 one-week sprints. Currently in **Week 4** (sign-off week).
**Current state:** No application code written yet. GitHub repo and Trello board are set up. All planning docs (RTM, Risk Register, SMART Goals, ADRs) are complete. This is the first code being written.

---

## What We're Building Right Now

**Backend skeleton only.** Frontend will come later. The goal for this sprint is to have a working Express + TypeScript API with:

1. Onion architecture folder structure (Domain → Application → Infrastructure)
2. Authentication (JWT register/login)
3. Role-based access control (admin vs member)
4. Task CRUD endpoints (create, read, update, delete)
5. Task assignment endpoint
6. In-memory dummy data store (no real database yet — we'll use a simple in-memory array/map that acts like a repository. This demonstrates good practice with repository pattern so swapping to MongoDB later is trivial)
7. Domain events + audit log (lightweight EventEmitter-based)
8. Proper error handling with consistent response envelope
9. CI-ready project setup (ESLint, Prettier, Jest, tsconfig)

---

## Architecture Decisions (ADRs)

### ADR-001: Modular Monolith (not Microservices)
- Single deployable application with clear module boundaries
- Modules: Identity, Task, Club/Event, Notification
- Modules communicate via in-process method calls and a shared event bus
- Why: 3-person team, 12-week timeline — microservices infrastructure overhead would consume 3-4 weeks we don't have

### ADR-002: Onion Architecture (Clean Architecture)
- **Domain Layer (innermost):** Entities, value objects, domain events, repository interfaces. ZERO external dependencies. No Express, no Mongoose, no framework imports.
- **Application Layer:** Use cases / service classes that orchestrate domain logic. Defines DTOs. Depends only on Domain layer.
- **Infrastructure Layer (outermost):** Express routes, database repositories, middleware, external APIs. Depends on Application and Domain.
- **Dependencies always point inward.** Infrastructure → Application → Domain. Never the reverse.

### ADR-003: Stateless Hosting (Azure Container Apps)
- Stateless by design — no server-side sessions
- JWT for authentication (access token 15min, refresh token 7 days)
- All state externalised to database (for now, in-memory store)
- Containerised with Docker for deployment

### ADR-004: Tech Stack
- **Runtime:** Node.js + TypeScript (strict mode)
- **Framework:** Express
- **Database (production):** MongoDB with Mongoose (later)
- **Database (now):** In-memory store implementing repository interfaces — demonstrates repository pattern, easy to swap
- **Auth:** JWT (jsonwebtoken) + bcrypt for password hashing
- **Testing:** Jest + Supertest
- **Linting:** ESLint + Prettier
- **CI:** GitHub Actions

### ADR-005: Pragmatic Event-Driven (not full Event Sourcing)
- CRUD is the source of truth (standard create/update/delete on entities)
- After each write, publish a domain event via in-process EventEmitter
- Events persisted to an audit log (in-memory array for now, MongoDB collection later)
- Events drive side effects: notifications, audit trail
- This gives us audit history without the complexity of event replay/projections

### ADR-006: REST API Conventions
- Base URL: `/api/v1/{resource}`
- Response envelope: `{ success: true, data: {...}, meta?: {...} }` or `{ success: false, error: { code: string, message: string, details?: any[] } }`
- HTTP status codes: 200 (read/update), 201 (create), 204 (delete), 400 (validation), 401 (no auth), 403 (forbidden), 404 (not found), 500 (server error)
- Auth: Bearer token in `Authorization` header
- Content-Type: `application/json`

---

## Folder Structure

```
monash-club-task-manager/
├── CLAUDE.md                          # This file
├── .vscode/
│   ├── settings.json                  # Shared editor settings
│   └── extensions.json                # Recommended extensions
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI pipeline
├── .env.example                       # Environment variable template
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── jest.config.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── src/
│   ├── index.ts                       # Entry point — bootstraps Express app
│   ├── app.ts                         # Express app factory (no listen here)
│   ├── config/
│   │   └── index.ts                   # Environment config (port, jwt secret, etc.)
│   │
│   ├── shared/
│   │   ├── domain/
│   │   │   ├── Entity.ts              # Base entity class (id, createdAt, updatedAt)
│   │   │   ├── DomainEvent.ts         # Base domain event interface
│   │   │   └── AuditEvent.ts          # Audit event type
│   │   ├── application/
│   │   │   ├── EventBus.ts            # Event bus interface + Node EventEmitter implementation
│   │   │   └── UseCase.ts             # Base use case interface
│   │   └── infrastructure/
│   │       ├── middleware/
│   │       │   ├── authMiddleware.ts   # JWT verification middleware
│   │       │   ├── requireRole.ts     # Role-based access control middleware
│   │       │   ├── errorHandler.ts    # Global error handler
│   │       │   └── requestLogger.ts   # Request logging
│   │       ├── http/
│   │       │   └── ApiResponse.ts     # Standard response envelope helpers
│   │       └── audit/
│   │           └── AuditLogger.ts     # Listens to events, writes to audit store
│   │
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── domain/
│   │   │   │   ├── User.ts            # User entity (id, email, name, passwordHash, role)
│   │   │   │   ├── Role.ts            # Role enum (ADMIN, MEMBER)
│   │   │   │   └── IUserRepository.ts # Interface — findByEmail, findById, save, etc.
│   │   │   ├── application/
│   │   │   │   ├── RegisterUseCase.ts # Register new user
│   │   │   │   ├── LoginUseCase.ts    # Authenticate, return JWT
│   │   │   │   └── dtos/
│   │   │   │       ├── RegisterDTO.ts
│   │   │   │       └── LoginDTO.ts
│   │   │   └── infrastructure/
│   │   │       ├── InMemoryUserRepository.ts  # In-memory implementation with seed data
│   │   │       └── identityRoutes.ts          # POST /api/v1/auth/register, POST /api/v1/auth/login
│   │   │
│   │   └── task/
│   │       ├── domain/
│   │       │   ├── Task.ts            # Task entity (id, title, description, status, assigneeId, dueDate, priority, createdBy)
│   │       │   ├── TaskStatus.ts      # Enum: TODO, IN_PROGRESS, DONE
│   │       │   ├── TaskPriority.ts    # Enum: LOW, MEDIUM, HIGH
│   │       │   ├── ITaskRepository.ts # Interface — findAll, findById, save, update, delete, findByAssignee
│   │       │   └── events/
│   │       │       ├── TaskCreatedEvent.ts
│   │       │       ├── TaskAssignedEvent.ts
│   │       │       ├── TaskStatusChangedEvent.ts
│   │       │       └── TaskDeletedEvent.ts
│   │       ├── application/
│   │       │   ├── CreateTaskUseCase.ts
│   │       │   ├── UpdateTaskUseCase.ts
│   │       │   ├── DeleteTaskUseCase.ts
│   │       │   ├── AssignTaskUseCase.ts
│   │       │   ├── ChangeTaskStatusUseCase.ts
│   │       │   ├── GetTasksUseCase.ts
│   │       │   ├── GetTaskByIdUseCase.ts
│   │       │   └── dtos/
│   │       │       ├── CreateTaskDTO.ts
│   │       │       ├── UpdateTaskDTO.ts
│   │       │       └── AssignTaskDTO.ts
│   │       └── infrastructure/
│   │           ├── InMemoryTaskRepository.ts  # In-memory implementation with seed data
│   │           └── taskRoutes.ts              # CRUD routes under /api/v1/tasks
│   │
│   └── seed/
│       └── seedData.ts                # Pre-populated dummy users and tasks for demo
│
└── tests/
    ├── unit/
    │   ├── modules/
    │   │   ├── identity/
    │   │   │   └── LoginUseCase.test.ts
    │   │   └── task/
    │   │       ├── CreateTaskUseCase.test.ts
    │   │       └── Task.test.ts         # Domain entity tests
    │   └── shared/
    │       └── EventBus.test.ts
    └── integration/
        ├── auth.test.ts                 # Register + login flow via Supertest
        └── tasks.test.ts               # Task CRUD via Supertest
```

---

## Domain Model

### User Entity
```typescript
{
  id: string;             // UUID
  email: string;          // Unique
  name: string;
  passwordHash: string;   // bcrypt hashed
  role: Role;             // ADMIN | MEMBER
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Entity
```typescript
{
  id: string;             // UUID
  title: string;          // Required, 1-200 chars
  description: string;    // Optional
  status: TaskStatus;     // TODO | IN_PROGRESS | DONE
  priority: TaskPriority; // LOW | MEDIUM | HIGH
  assigneeId?: string;    // User ID, optional
  dueDate?: Date;         // Optional
  createdBy: string;      // User ID of creator
  clubId?: string;        // For future multi-club support
  createdAt: Date;
  updatedAt: Date;
}
```

### Audit Event
```typescript
{
  id: string;
  eventType: string;       // e.g. 'TaskCreated', 'TaskAssigned'
  aggregateType: string;   // e.g. 'Task', 'User'
  aggregateId: string;     // ID of the affected entity
  actor: string;           // User ID who performed the action
  timestamp: Date;
  payload: Record<string, any>;  // Event-specific data
  metadata: {
    module: string;        // e.g. 'task', 'identity'
  };
}
```

---

## API Endpoints

### Authentication
```
POST /api/v1/auth/register
  Body: { email, name, password, role? }
  → 201: { success: true, data: { user: { id, email, name, role }, token } }

POST /api/v1/auth/login
  Body: { email, password }
  → 200: { success: true, data: { user: { id, email, name, role }, token } }
```

### Tasks (all require Bearer token)
```
GET    /api/v1/tasks              → 200: list all tasks (optionally filter by status, assignee, priority)
GET    /api/v1/tasks/:id          → 200: single task
POST   /api/v1/tasks              → 201: create task (admin only)
  Body: { title, description?, priority?, dueDate?, assigneeId? }
PUT    /api/v1/tasks/:id          → 200: update task (admin only)
  Body: { title?, description?, priority?, dueDate?, status? }
DELETE /api/v1/tasks/:id          → 204: delete task (admin only)
PATCH  /api/v1/tasks/:id/assign   → 200: assign task to user (admin only)
  Body: { assigneeId }
PATCH  /api/v1/tasks/:id/status   → 200: change task status (admin or assignee)
  Body: { status }
```

### Audit (optional, for demo)
```
GET /api/v1/audit                 → 200: list recent audit events (admin only)
```

---

## Seed / Dummy Data

Since we're not connecting to a real database yet, the in-memory repositories should be pre-populated with seed data on server startup:

### Seed Users
```
Admin:  { email: "admin@monash.edu", name: "Club Admin", role: ADMIN, password: "admin123" }
Member1: { email: "member1@monash.edu", name: "Alice Wong", role: MEMBER, password: "member123" }
Member2: { email: "member2@monash.edu", name: "Bob Smith", role: MEMBER, password: "member123" }
```

### Seed Tasks
```
Task1: { title: "Book venue for O-Week stall", status: TODO, priority: HIGH, assignee: Member1, dueDate: 2 weeks from now, createdBy: Admin }
Task2: { title: "Design event poster", status: IN_PROGRESS, priority: MEDIUM, assignee: Member2, createdBy: Admin }
Task3: { title: "Order club merchandise", status: TODO, priority: LOW, assignee: null, createdBy: Admin }
Task4: { title: "Submit sponsorship proposal", status: DONE, priority: HIGH, assignee: Member1, createdBy: Admin }
Task5: { title: "Set up Discord server", status: IN_PROGRESS, priority: MEDIUM, assignee: Member2, createdBy: Admin }
```

---

## Coding Standards

### General
- **TypeScript strict mode** (`"strict": true` in tsconfig)
- Use `var` is BANNED. Use `const` by default, `let` only when reassignment is needed
- Use `interface` for object shapes, `type` for unions/intersections
- No `any` — use `unknown` and narrow, or define proper types
- Async/await everywhere — no raw Promise chains or callbacks
- Early return pattern — avoid deep nesting
- Error messages should be user-friendly, not stack traces

### Naming Conventions
- Files: PascalCase for classes/entities (`CreateTaskUseCase.ts`), camelCase for utilities (`authMiddleware.ts`)
- Variables/functions: camelCase
- Classes/interfaces/types: PascalCase
- Enums: PascalCase with UPPER_SNAKE values (`TaskStatus.IN_PROGRESS`)
- Constants: UPPER_SNAKE_CASE
- Interface names: prefix with `I` for repository interfaces (`ITaskRepository`)
- Route files: camelCase with `Routes` suffix (`taskRoutes.ts`)

### Code Style
- Use `var` for variable declarations is NOT allowed — always use `const` or `let`
- Prefer explicit return types on public methods and use case execute methods
- Keep functions small — if a function is longer than 30 lines, consider splitting
- No comments that state the obvious. Comment WHY, not WHAT
- Don't over-comment. The code should be self-documenting through good naming
- No "AI-ish" patterns — no unnecessary abstractions, no over-engineering
- Keep it pragmatic — this is a capstone, not enterprise software

### Architecture Rules (CRITICAL)
- **Domain layer MUST NOT import from Application or Infrastructure**
- **Application layer MUST NOT import from Infrastructure**
- **Infrastructure CAN import from Application and Domain**
- Repository interfaces live in Domain; implementations live in Infrastructure
- Use cases receive repository interfaces via constructor injection (dependency inversion)
- Express `req`/`res` objects MUST NOT leak into Application or Domain layers — map to DTOs at the route handler level

### Testing
- Test files mirror source structure: `src/modules/task/application/CreateTaskUseCase.ts` → `tests/unit/modules/task/CreateTaskUseCase.test.ts`
- Unit tests: test use cases with mock/fake repositories (in-memory implementations work great here)
- Integration tests: test routes with Supertest against the actual Express app
- Name tests descriptively: `it("should return 403 when non-admin tries to create a task")`
- Each test should test one thing

---

## Environment Variables (.env)

```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## Requirements Traceability (RTM) — What We're Building Against

These are the requirements from our RTM that this backend must satisfy:

| Req. ID | Description | Priority | Status |
|---------|------------|----------|--------|
| R1 | Admin can create, edit, delete tasks | High | Building now |
| R2 | Admin can assign tasks to team members | High | Building now |
| R3 | Admin can set deadlines, users receive reminders | Medium | Building now (deadline storage; reminder logic later) |
| R4 | Users can view task status (ToDo/InProgress/Done) | Medium | Building now |
| R5 | Users can categorise and filter tasks | Medium | Stretch goal |
| R7 | Role-based access control (admin vs member) | High | Building now |
| R11 | Data encrypted in storage and transmission | High | Building now (bcrypt + HTTPS-ready) |
| R13 | Application loads within 3 seconds | High | Validated later |

---

## Week 4 Sign-off Context

This code is being built during **Week 4** of the capstone. The Week 4 sign-off requires:
1. ✅ Risk Register — completed
2. ✅ SMART Goals — completed
3. ✅ RTM — completed
4. ✅ Updated Kanban Board — maintained in Trello

The skeleton code demonstrates to the tutor that:
- Architecture decisions have been implemented (not just documented)
- The team has a working development environment
- CI pipeline is functional
- Code structure follows the onion architecture described in the ADRs
- Repository pattern with in-memory stores shows the path to MongoDB integration

---

## What NOT to Do

- Do NOT connect to MongoDB yet — use in-memory repositories only
- Do NOT install unnecessary packages — keep dependencies minimal
- Do NOT create frontend code — backend only for now
- Do NOT use `class-validator` or `class-transformer` — keep validation simple with manual checks or a lightweight library like `zod`
- Do NOT add Swagger/OpenAPI yet — that's a later sprint
- Do NOT use an ORM — we're using the repository pattern with interfaces
- Do NOT over-abstract — no generic base repository class unless it actually saves code. Keep it simple
- Do NOT add WebSocket support yet — REST only for now

---

## Commands to Know

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

---

## Package Dependencies (Expected)

### Production
- `express` — Web framework
- `cors` — CORS middleware
- `helmet` — Security headers
- `jsonwebtoken` — JWT creation/verification
- `bcrypt` — Password hashing
- `uuid` — Generate unique IDs
- `dotenv` — Environment variables
- `zod` — Schema validation (lightweight, TypeScript-native)

### Development
- `typescript` — TypeScript compiler
- `ts-node` — Run TypeScript directly
- `ts-node-dev` or `tsx` — Hot-reload dev server
- `@types/express` — Express type definitions
- `@types/cors` — CORS type definitions
- `@types/jsonwebtoken` — JWT type definitions
- `@types/bcrypt` — bcrypt type definitions
- `@types/uuid` — UUID type definitions
- `jest` — Test runner
- `ts-jest` — Jest TypeScript transformer
- `@types/jest` — Jest type definitions
- `supertest` — HTTP integration testing
- `@types/supertest` — Supertest type definitions
- `eslint` — Linting
- `@typescript-eslint/eslint-plugin` — TypeScript ESLint rules
- `@typescript-eslint/parser` — TypeScript ESLint parser
- `prettier` — Code formatting
- `eslint-config-prettier` — Disable ESLint rules that conflict with Prettier

---

## Build Instructions for Claude Code

When building this project, follow this order:

### Phase 1: Project scaffold
1. Initialise `package.json` with the dependencies listed above
2. Create `tsconfig.json` with strict mode
3. Create `.eslintrc.js`, `.prettierrc`, `jest.config.ts`
4. Create `.env.example`
5. Create `.gitignore` (node_modules, dist, .env, coverage)
6. Create `Dockerfile` and `docker-compose.yml`
7. Create `.vscode/settings.json` and `.vscode/extensions.json`
8. Create `.github/workflows/ci.yml`

### Phase 2: Shared infrastructure
1. `src/config/index.ts` — environment config
2. `src/shared/domain/Entity.ts` — base entity
3. `src/shared/domain/DomainEvent.ts` — event interface
4. `src/shared/application/EventBus.ts` — EventEmitter wrapper
5. `src/shared/application/UseCase.ts` — base use case interface
6. `src/shared/infrastructure/http/ApiResponse.ts` — response helpers
7. `src/shared/infrastructure/middleware/errorHandler.ts`
8. `src/shared/infrastructure/middleware/requestLogger.ts`
9. `src/shared/infrastructure/audit/AuditLogger.ts`

### Phase 3: Identity module
1. Domain: `User.ts`, `Role.ts`, `IUserRepository.ts`
2. Application: `RegisterUseCase.ts`, `LoginUseCase.ts`, DTOs
3. Infrastructure: `InMemoryUserRepository.ts`, `identityRoutes.ts`
4. Middleware: `authMiddleware.ts`, `requireRole.ts`

### Phase 4: Task module
1. Domain: `Task.ts`, `TaskStatus.ts`, `TaskPriority.ts`, `ITaskRepository.ts`, domain events
2. Application: All use cases + DTOs
3. Infrastructure: `InMemoryTaskRepository.ts`, `taskRoutes.ts`

### Phase 5: Wiring
1. `src/app.ts` — Express app factory, register all routes and middleware
2. `src/index.ts` — Bootstrap, seed data, start server
3. `src/seed/seedData.ts` — Populate in-memory stores

### Phase 6: Tests
1. Unit tests for Task domain entity (status transitions, validation)
2. Unit tests for CreateTaskUseCase, LoginUseCase (with in-memory repos)
3. Integration tests for auth routes (register, login, protected access)
4. Integration tests for task CRUD routes (with auth)

### Phase 7: Verify
1. Run `npm run lint` — no errors
2. Run `npm run typecheck` — no errors
3. Run `npm test` — all pass
4. Run `npm run dev` — server starts on port 3000
5. Test manually: register → login → create task → list tasks → assign → change status → delete
