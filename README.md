# Monash Club Task Manager

> A task management application for Monash University clubs to plan, assign, track, and review tasks for events and activities.

**FIT3162 Computer Science Capstone Project** — Team CS-07 (Thanh Tung Le, Ruizhi Wang, Ethan Arsabhuvana)

## Deployed Demo

| Component | URL |
|---|---|
| Frontend | https://relaxed-toffee-57ab18.netlify.app |
| Backend API | https://cs-07.onrender.com |
| Health check | https://cs-07.onrender.com/health |
| Database | MongoDB Atlas (Sydney region, M0 free tier) |

> These URLs are hosted on free-tier services and may not remain active indefinitely after the semester ends.

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript (strict mode)
- **Backend:** Express, JWT auth, bcrypt, Zod validation
- **Frontend:** React + Vite + TypeScript + Tailwind CSS v3
- **Database:** MongoDB Atlas in production; in-memory adapter for local development and unit tests. Switchable via the `REPOSITORY_DRIVER` env var.
- **Testing:** Jest + Supertest (backend); Vitest + Testing Library (frontend) — **129 backend + 91 frontend = 220 tests** total
- **CI/CD:** GitHub Actions
- **Hosting:** Netlify (frontend) + Render (backend) + MongoDB Atlas (database)
- **Containerisation:** Docker + Docker Compose

## Prerequisites

- Node.js 18+
- npm 9+
- (Optional) Docker & Docker Compose
- (Optional) `jq` for the curl demo script: `brew install jq`
- (Optional) MongoDB Atlas account if you want to run with real persistence

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd cs-07

# 2. Install backend and frontend dependencies
npm install
cd frontend && npm install && cd ..

# 3. Configure environment variables
cp .env.example .env
# Edit .env if you want to use MongoDB; defaults are fine for in-memory mode.

# 4. Start the backend (port 3000)
npm run dev

# 5. In a second terminal, start the frontend (port 5173)
cd frontend && npm run dev
```

Open <http://localhost:5173> in your browser. Default mode is **in-memory** — no database needed for local development. Seed data (admin + member accounts + sample tasks) loads automatically on backend start.

### Switching to MongoDB

Set the following in `.env`:

```ini
REPOSITORY_DRIVER=mongo
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbName>
```

Then restart the backend. Seed the database with:

```bash
npm run seed:atlas
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
| `REPOSITORY_DRIVER` | `memory` | `memory` for in-memory adapters, `mongo` for MongoDB |
| `MONGODB_URI` | (empty) | Required when `REPOSITORY_DRIVER=mongo` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS origin for the frontend |

## Running the App

```bash
npm run dev          # Backend dev server (hot reload, port 3000)
npm run build        # Compile TypeScript to dist/
npm start            # Run the compiled build

# In frontend/
npm run dev          # Frontend dev server (port 5173)
npm run build        # Production frontend bundle
```

## Running Tests

```bash
# Backend (Jest + Supertest) — 129 tests
npm test
npm run test:watch

# Frontend (Vitest + Testing Library) — 91 tests
cd frontend && npx vitest run
```

## Other Commands

```bash
npm run typecheck     # TypeScript type check (no emit)
npm run lint          # ESLint
npm run format        # Prettier auto-format
npm run seed:atlas    # Seed the MongoDB Atlas database with demo data
```

## Database Restore

The Moodle archive ZIP includes a `db-export/` directory containing a `mongodump` snapshot of the demo database. To restore it into a fresh MongoDB instance:

### Option A — Restore from the included dump

```bash
mongorestore --uri="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbName>" db-export/
```

This recreates the exact data that was live during the demo.

### Option B — Recreate fresh demo data

```bash
# Make sure .env has REPOSITORY_DRIVER=mongo and MONGODB_URI set
npm run seed:atlas
```

This wipes existing collections and recreates the seed users, clubs, and tasks deterministically.

## Docker

```bash
docker compose up --build       # Full stack (API + MongoDB)
docker compose up api --build   # API only
```

## Demo Accounts

The seeded MongoDB Atlas database (and the in-memory dev mode) ship with these accounts:

| Role | Club | Email | Password |
|---|---|---|---|
| Admin | — | admin@monashclubs.org | Admin1234! |
| Admin | — | thanh@monashclubs.org | Admin1234! |
| Member | MASA | parsa.aghajani@monashclubs.org | Member1234! |
| Member | MASA | finlay.townsend@monashclubs.org | Member1234! |
| Member | SAS | eliza.burnes@monashclubs.org | Member1234! |
| Member | SAS | noah.caruso@monashclubs.org | Member1234! |

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
  -d '{"email":"admin@monashclubs.org","password":"Admin1234!"}'

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
| GET | `/api/v1/tasks` | List tasks (filter: `?status=`, `?priority=`, `?assigneeId=`, `?tag=`, `?search=`, `?dueBefore=`, `?dueAfter=`, `?page=`, `?limit=`) | Any authenticated (RBAC-scoped) |
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
│   ├── config/                   # Environment config + driver selection
│   ├── modules/
│   │   ├── identity/             # Auth module (User, Login, Register)
│   │   ├── notification/         # In-app notifications
│   │   └── task/                 # Task module (CRUD, assign, status, reminders)
│   ├── seed/                     # Seed data for in-memory stores
│   └── shared/                   # Base classes, middleware, event bus
├── tests/
│   ├── unit/                     # Domain + use case tests
│   └── integration/              # Route tests via Supertest
├── frontend/                     # React + Vite frontend
├── scripts/
│   └── seed-atlas.ts             # MongoDB Atlas seed script
├── docs/                         # Project documentation
│   ├── PROJECT_STATUS.md         # What's done / not done
│   ├── PROJECT_CONTEXT.md        # Academic context, RTM, risks
│   ├── deployment-plan.md        # Sprint 11 cloud migration plan
│   └── diagrams/                 # Mermaid architecture diagrams
├── db-export/                    # MongoDB dump for archival restore (Moodle ZIP only)
├── demo-curl.sh                  # API demo script
├── postman_collection.json       # Postman collection
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Documentation

- [Project Status](docs/PROJECT_STATUS.md) — Feature checklist and RTM coverage
- [Project Context](docs/PROJECT_CONTEXT.md) — Academic context, team, architecture, risks
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Style Guide](docs/STYLE_GUIDE.md)
- [Deployment Plan](docs/deployment-plan.md) — Sprint 11 cloud migration plan
- [Diagrams Index](docs/diagrams/README.md) — how to view + full list
- [Onion Architecture](docs/diagrams/onion-architecture.mmd) — backend layering diagram
- [System Overview](docs/diagrams/system-overview.md) — elevator pitch for stakeholders
- [Architecture Diagram](docs/diagrams/architecture.md)
- [Backend Modules](docs/diagrams/backend-modules.md)
- [Request Flow](docs/diagrams/request-flow.md)
- [Database Schema](docs/diagrams/database.md)
