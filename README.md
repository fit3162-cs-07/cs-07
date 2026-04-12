# Monash Club Task Manager

> A task management application for Monash University clubs to plan, assign, track, and review tasks for events and activities.

**FIT3162 Computer Science Capstone Project** — Team CS-07 (Thanh Tung Le, Ruizhi Wang, Ethan Arsabhuvana)

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript (strict mode)
- **Backend:** Express, JWT auth, bcrypt, Zod validation
- **Frontend:** React + Vite + TypeScript (in progress)
- **Database:** In-memory repositories (MongoDB planned)
- **Testing:** Jest + Supertest
- **CI:** GitHub Actions
- **Containerisation:** Docker + Docker Compose

## Prerequisites

- Node.js 18+
- npm 9+
- (Optional) Docker & Docker Compose
- (Optional) `jq` for the curl demo script: `brew install jq`

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd cs-07

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# (Optional) Install frontend dependencies
cd frontend && npm install && cd ..
```

## Environment Variables

Defined in `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `JWT_SECRET` | (set your own) | Secret key for JWT signing |
| `JWT_EXPIRY` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token expiry (future use) |

## Running the App

```bash
# Development server (hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

Server starts at `http://localhost:3000`. Seed data loads automatically (3 users, 5 tasks).

## Running Tests

```bash
npm test              # All tests (6 suites, 21 tests)
npm run test:watch    # Watch mode
```

## Other Commands

```bash
npm run typecheck     # TypeScript type check (no emit)
npm run lint          # ESLint
npm run format        # Prettier auto-format
```

## Docker

```bash
docker compose up --build       # Full stack (API + MongoDB)
docker compose up api --build   # API only
```

## Demo Accounts (Seeded)

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@monash.edu | admin123 | ADMIN |
| Alice | member1@monash.edu | member123 | MEMBER |
| Bob | member2@monash.edu | member123 | MEMBER |

## Demoing the Backend (No Frontend)

### Option 1: Curl demo script

```bash
chmod +x demo-curl.sh && ./demo-curl.sh
```

Walks through the full API flow: register, login, create tasks, assign, change status.

### Option 2: Postman

Import `postman_collection.json` — 15 pre-built requests with auto-captured tokens.

### Option 3: Manual curl

```bash
# Login as admin
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monash.edu","password":"admin123"}'

# Use the returned token for subsequent requests
TOKEN="<paste token here>"

# List all tasks
curl -s http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"

# Create a task
curl -s -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New task","priority":"HIGH"}'
```

## API Endpoints

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login, returns JWT token |

### Tasks (require Bearer token)

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| GET | `/api/v1/tasks` | List tasks (filter: `?status=`, `?priority=`, `?assigneeId=`) | Any authenticated |
| GET | `/api/v1/tasks/:id` | Get single task | Any authenticated |
| POST | `/api/v1/tasks` | Create task | Admin only |
| PUT | `/api/v1/tasks/:id` | Update task | Admin only |
| DELETE | `/api/v1/tasks/:id` | Delete task | Admin only |
| PATCH | `/api/v1/tasks/:id/assign` | Assign task to member | Admin only |
| PATCH | `/api/v1/tasks/:id/status` | Change task status | Admin or assignee |

### Audit

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| GET | `/api/v1/audit` | View audit event log | Admin only |

## Project Structure

```
cs-07/
├── src/
│   ├── index.ts                  # Entry point
│   ├── app.ts                    # Express app factory
│   ├── config/                   # Environment config
│   ├── modules/
│   │   ├── identity/             # Auth module (User, Login, Register)
│   │   └── task/                 # Task module (CRUD, assign, status)
│   ├── seed/                     # Seed data for in-memory stores
│   └── shared/                   # Base classes, middleware, event bus
├── tests/
│   ├── unit/                     # Domain + use case tests
│   └── integration/              # Route tests via Supertest
├── frontend/                     # React + Vite frontend (in progress)
├── docs/                         # Project documentation
│   ├── PROJECT_STATUS.md         # What's done / not done
│   ├── PROJECT_CONTEXT.md        # Academic context, RTM, risks
│   ├── AGENT_HANDOFF.md          # Prompt for next Claude Code session
│   ├── PROJECT_SPEC_ORIGINAL.md  # Full original project spec & ADRs
│   └── diagrams/                 # Mermaid architecture diagrams
├── CLAUDE.md                     # Claude Code auto-loaded context
├── demo-curl.sh                  # API demo script
├── postman_collection.json       # Postman collection
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Documentation

- [Project Status](docs/PROJECT_STATUS.md) — Feature checklist and RTM coverage
- [Project Context](docs/PROJECT_CONTEXT.md) — Academic context, team, architecture, risks
- [Agent Handoff](docs/AGENT_HANDOFF.md) — Prompt for new Claude Code sessions
- [Original Project Spec](docs/PROJECT_SPEC_ORIGINAL.md) — Full ADRs, domain model, build phases
- [Diagrams Index](docs/diagrams/README.md) — how to view + full list
- [System Overview](docs/diagrams/system-overview.md) — elevator pitch for stakeholders
- [Architecture Diagram](docs/diagrams/architecture.md)
- [Backend Modules](docs/diagrams/backend-modules.md)
- [Request Flow](docs/diagrams/request-flow.md)
- [Database Schema](docs/diagrams/database.md)
