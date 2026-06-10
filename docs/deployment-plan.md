# Deployment Plan — Sprint 11 Cloud Migration

**Author:** Thanh
**Status:** Draft, review-before-execution
**Closes:** R9 (scalability evidence), R11 (encryption in transit), R12 (>95% uptime), R13 (page load <3 s)

The stack currently runs only on localhost. Without a public URL we cannot demo the app from a phone, cannot prove the >95% uptime target, and cannot run a Lighthouse audit for R13 evidence. This document defines the smallest deployment that unblocks all of the above for the Week 12 demo, with no production hardening beyond what the rubric requires.

This is a written plan **only**. No cloud provider account, deployment, or schema-writing work happens until this PR is reviewed and merged.

---

## 1. Architecture decision

### Proposed stack

| Layer    | Service                | Free tier | Why this choice                                                                                                                                |
| -------- | ---------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | **Vercel**             | Unlimited static builds, generous bandwidth | Native Vite support, automatic preview per PR, push-to-deploy from GitHub, free TLS at the edge, fastest first-paint of any free-tier option   |
| Backend  | **Render (recommended)** — Railway as fallback | 750 hours / month web service | Stable free tier with no credit expiry, native Node.js builds from GitHub, free TLS, predictable cost model for a 1-week demo window           |
| Database | **MongoDB Atlas (M0)** | 512 MB shared cluster | Free, hosted, multi-region, integrates with both Render and Vercel via standard `MONGODB_URI`, no infra to operate during exam period          |

### Why not the alternatives

- **Heroku** — no usable free tier since 2022; the cheapest paid plan is ~$7/mo per dyno, blows the zero-budget constraint for a 1-week demo.
- **AWS / GCP / Azure** — IAM, networking, and quota management dominate the timeline; a 3-person student team will spend more time on cloud config than on the application itself.
- **Fly.io** — workable, but the free allowance was tightened in 2024 (now credit-based, similar to Railway). Render's hours-based allowance is easier to reason about for a finite demo window.

### Render vs Railway — direct comparison

| Dimension              | Render (free)                                                                          | Railway (trial / hobby)                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Free tier shape        | 750 instance-hours / month per service; resets monthly                                 | $5 trial credit, then $5/mo hobby plan; usage-based, sleeps if credit exhausted                  |
| Cold-start behaviour   | Sleeps after **15 min** idle; wake takes ~30–50 s on a small Node service              | No automatic sleep on hobby; trial credit can run out mid-demo if traffic spikes                 |
| Deploy method          | Connect GitHub repo → Render builds on every push to a configured branch               | Connect GitHub repo → Railway builds on every push; supports CLI deploy too                      |
| Env var management     | Per-service env tab in dashboard; secrets are masked; group reuse across services      | Per-project variables tab; supports reference variables and shared groups                        |
| Logs UX                | Streaming logs in dashboard, last ~7 days retained, no aggregation in free tier        | Streaming logs in dashboard, comparable retention, slightly nicer filter UI                      |
| Custom domain + TLS    | Free, automatic                                                                        | Free, automatic                                                                                  |
| Region choice (free)   | Oregon, Frankfurt, Singapore, Ohio                                                     | US-West / US-East by default                                                                     |

**Pick: Render.** A predictable hours-based allowance suits a fixed 1-week demo window better than Railway's credit-based model, where a runaway loop or unexpected traffic can silently drain the budget mid-presentation. The 15-min sleep penalty is real but cheaply mitigated by a 5-minute keep-warm ping during demo week (covered in §3 and §7).

---

## 1.5 Account ownership strategy

The team intends to keep this project around as portfolio material after graduation. The cloud accounts that own Atlas, Render, Vercel, and UptimeRobot must survive the moment Monash deactivates the student emails, or we will lose access to our own deployed system mid-portfolio-window.

### Recommended pattern

| Service                | Primary account owner                              | Why                                                                                       |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| MongoDB Atlas          | Shared team Gmail (e.g. `fit3162.s2cs07@gmail.com`) | Free Gmail, no expiry, shared password in a team password manager                          |
| Render                 | Same shared team Gmail                              | One identity across all four services; no per-service account juggling                    |
| Vercel                 | Same shared team Gmail                              | Same                                                                                      |
| UptimeRobot            | Same shared team Gmail                              | Same                                                                                      |
| GitHub Student Pack    | Thanh's Monash email (`tlee0091@student.monash.edu`) | Additive bonus credits (Atlas extra storage, Vercel Pro trial, Render credit) applied to the shared-Gmail-owned accounts — the Pack does **not** bind those accounts to the student email |

### Explicitly NOT recommended

Using a Monash student email (anyone's) as the primary account holder for Atlas / Render / Vercel. The student email is deactivated post-graduation; **the team would lose admin access to its own deployment**, including the ability to rotate the JWT secret if it leaks or to delete the cluster when free-tier limits change.

### Override

If the team decides to use a Monash email as primary anyway, the post-graduation access loss must be added to §7 risks with an explicit mitigation (export of Atlas data + transfer-of-ownership procedure documented before graduation).

### Setup steps (for whoever runs Phase 1)

1. Create `fit3162.s2cs07@gmail.com` (or similar — confirm name in team meeting).
2. Store the password in 1Password / Bitwarden / equivalent shared vault.
3. Sign up to Atlas, Render, Vercel, UptimeRobot using that Gmail.
4. Thanh separately verifies the GitHub Student Pack on his student email and applies the credits to the shared-account services as bonuses.

---

## 2. MongoDB migration plan

### 2.1 Boundary

The Onion architecture isolates persistence to the Infrastructure layer. Domain entities (`User`, `Task`, `Notification`) know nothing about Mongo; use cases depend only on repository interfaces (`IUserRepository`, `ITaskRepository`, `INotificationRepository`). Migration touches:

- `src/modules/identity/infrastructure/` — add `MongoUserRepository`
- `src/modules/task/infrastructure/` — add `MongoTaskRepository`, plus new `MongoReminderStateRepository` (see §2.5)
- `src/modules/notification/infrastructure/` — add `MongoNotificationRepository`
- `src/shared/infrastructure/audit/` — optional `MongoAuditLogger` (see §2.6)
- `src/shared/infrastructure/db/` — new file, `connectMongo.ts`, owns the connection lifecycle
- `src/index.ts` — composition root chooses in-memory vs Mongo per env (see §2.7)

**Domain and Application layers do not change.** This is the whole point of the repository pattern paying off.

### 2.2 Aggregate inventory

| Aggregate      | Current location                                                       | Persistence today                                  | In scope this sprint                                          |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| User           | `src/modules/identity/domain/User.ts`                                  | `InMemoryUserRepository` (Map)                     | Yes — schema + repo                                           |
| Task           | `src/modules/task/domain/Task.ts` (+ `Tag` value object)               | `InMemoryTaskRepository` (Map)                     | Yes — schema + repo                                           |
| Notification   | `src/modules/notification/domain/Notification.ts`                      | `InMemoryNotificationRepository` (Map)             | Yes — schema + repo                                           |
| Reminder state | Implicit: `alreadyReminded: Set<string>` inside `CheckDueRemindersUseCase` | Process memory; lost on restart                    | Yes — new `ReminderState` schema + repo (see §2.5)            |
| Audit log      | `AuditLogger` in `src/shared/infrastructure/audit/AuditLogger.ts`      | Process memory array; lost on restart              | Optional — flagged as §2.6 stretch goal                       |
| Club           | Not implemented (`clubId?: string` exists on `Task` but no entity)     | n/a                                                | **Out of scope** — defer to a future sprint                   |

### 2.3 Per-aggregate schemas

Conventions used throughout:
- `_id` is a **string UUID v4** (matching what `Entity` already generates), not a Mongo ObjectId. This means seed data and existing in-memory tests continue to read the same ID format.
- Schema-level `timestamps: { createdAt, updatedAt }` mirrors what `Entity` already maintains in `touch()` — Mongoose owns the writes once an entity goes through Mongo.
- No soft-delete flag in any schema this sprint. Current behaviour is hard delete (`InMemoryTaskRepository.delete(id)`); preserving that keeps the migration scope-bounded. Flagged as future work in §7.
- Mapper functions live next to each repo (`UserMapper.toDomain`, `UserMapper.toPersistence`) so the domain entity never imports Mongoose.

#### 2.3.1 User

| Domain entity (`User.ts`)          | Type                  | Mongoose schema field      | Type                                                       | Notes                                                                          |
| ---------------------------------- | --------------------- | -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id` (inherited from `Entity`)     | `string` (uuid v4)    | `_id`                      | `String, default: uuid()`                                  | Override Mongo's ObjectId default; keep entity-generated UUIDs                 |
| `email`                            | `string`              | `email`                    | `String, required, lowercase, trim, unique index`          | Application already lower-cases on register; index enforces uniqueness         |
| `name`                             | `string`              | `name`                     | `String, required, trim, maxlength: 80`                    | Length matches Zod register schema                                             |
| `passwordHash`                     | `string` (bcrypt)     | `passwordHash`             | `String, required, select: false`                          | `select: false` so it never accidentally ships in a query response             |
| `role`                             | `Role` enum           | `role`                     | `String, enum: ['ADMIN','MEMBER'], default: 'MEMBER'`      | Enum mirrors `Role` exactly                                                    |
| `isActive`                         | `boolean`             | `isActive`                 | `Boolean, default: true, index: true`                      | Indexed because login path filters on it on every auth                         |
| `createdAt`, `updatedAt`           | `Date`                | (schema timestamps)        | auto                                                       | Set `{ timestamps: true }` at schema level                                     |

**Field-level decisions to ratify**

- **`email` index is unique.** Confirmed — `RegisterUseCase` already rejects duplicate emails at the application level; the DB index is belt-and-braces.
- **`passwordHash` is `select: false`.** Recommended — defence in depth; explicit `+passwordHash` selection required in `LoginUseCase`'s repo call (one-line change to `MongoUserRepository.findByEmail`).
- **No `lastLoginAt`.** Out of scope; not required by R12 or R7.

**Mapper**: `UserMapper.toDomain(doc) → User`, `UserMapper.toPersistence(user) → { _id, email, name, passwordHash, role, isActive }`. Timestamps are Mongo-managed on write.

#### 2.3.2 Task

| Domain entity (`Task.ts`)                  | Type                       | Mongoose schema field   | Type                                                                  | Notes                                                                                                                       |
| ------------------------------------------ | -------------------------- | ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`                                       | `string`                   | `_id`                   | `String, default: uuid()`                                             |                                                                                                                             |
| `title`                                    | `string`                   | `title`                 | `String, required, trim, maxlength: 200`                              | Matches Zod limit                                                                                                           |
| `description`                              | `string` (default `''`)    | `description`           | `String, default: '', maxlength: 5000`                                | Default empty string mirrors the entity                                                                                     |
| `status`                                   | `TaskStatus` enum          | `status`                | `String, enum: ['TODO','IN_PROGRESS','DONE'], default: 'TODO', index` | Index supports Kanban + reminder filters                                                                                    |
| `priority`                                 | `TaskPriority` enum        | `priority`              | `String, enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM'`            |                                                                                                                             |
| `assigneeId`                               | `string?`                  | `assigneeId`            | `String, index: true, sparse: true`                                   | Referenced (not embedded). Sparse index because many tasks have no assignee                                                 |
| `dueDate`                                  | `Date?`                    | `dueDate`               | `Date, index: true, sparse: true`                                     | Indexed for `CheckDueRemindersUseCase` window queries                                                                       |
| `createdBy`                                | `string` (user id)         | `createdBy`             | `String, required, index: true`                                       | Index supports per-creator listing if added later                                                                            |
| `clubId`                                   | `string?`                  | `clubId`                | `String, sparse: true`                                                | Kept as a stub field; no Club aggregate exists yet                                                                          |
| `tags`                                     | `Tag[]` (value objects)    | `tags`                  | `[String], default: []`                                               | **Embedded** as a plain string array — `Tag` is a value object with no own ID; mapper round-trips via `Tag.createMany`     |
| `createdAt`, `updatedAt`                   | `Date`                     | (schema timestamps)     | auto                                                                  |                                                                                                                             |

**Field-level decisions to ratify**

- **Tags: embed as `[String]`, not a separate `tags` collection.** Confirmed embed — tags are a value object (no identity, no lifecycle), max 10 per task, max 30 chars each. Promoting to a referenced collection would buy us nothing and complicate filter queries.
- **Tag query index — single field `tags`.** Mongo supports multikey indexes on arrays of strings; `db.tasks.find({ tags: 'venue' })` then becomes an index hit. Add `tags: 1` to the schema.
- **`assigneeId` reference vs population.** Reference (string UUID), no Mongoose `ref` population. We resolve user names in the frontend via `useUsers`, not in the backend query. Keeps `MongoTaskRepository` returns identical to in-memory.
- **`dueDate` index.** Required — the reminder check scans tasks every 5 min with a date-range filter; without an index this becomes a full collection scan at scale.
- **Composite index for reminder check.** Recommend `{ status: 1, dueDate: 1 }` so `CheckDueRemindersUseCase`'s `status != DONE && dueDate in window` is fully indexable. Mongo can't use a composite index for an inequality on the first field plus a range on the second, so single-field indexes on each are sufficient; revisit only if reminder check shows slow logs.
- **Composite index `{ assigneeId: 1, status: 1 }`.** Required — the Kanban-by-assignee query (frontend asks "give me tasks for user X grouped by status") becomes a single index hit, and avoids fetching the assignee's whole task set into memory to bucket client-side.
- **No `deletedAt` / `archived` flag.** Hard delete preserved. If R6 (attachments) lands, revisit so attachment cleanup can run.

**Mapper**: `TaskMapper.toDomain(doc) → new Task({ ..., tags: doc.tags })` — `Task` constructor accepts `tags?: string[]` and calls `Tag.createMany`, so the round-trip is one line.

#### 2.3.3 Notification

| Domain entity (`Notification.ts`)  | Type                                                  | Mongoose schema field   | Type                                                                                  | Notes                                                                       |
| ---------------------------------- | ----------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`                               | `string`                                              | `_id`                   | `String, default: uuid()`                                                             |                                                                             |
| `userId`                           | `string`                                              | `userId`                | `String, required, index: true`                                                       | Reference (not populated)                                                   |
| `type`                             | `NotificationType` enum                               | `type`                  | `String, enum: ['TASK_ASSIGNED','TASK_REMINDER_DUE','TASK_STATUS_CHANGED']`           |                                                                             |
| `title`                            | `string`                                              | `title`                 | `String, required, maxlength: 200`                                                    |                                                                             |
| `body`                             | `string?`                                             | `body`                  | `String, maxlength: 1000`                                                             |                                                                             |
| `link`                             | `string?`                                             | `link`                  | `String, maxlength: 500`                                                              |                                                                             |
| `sourceAggregateId`                | `string?`                                             | `sourceAggregateId`     | `String, sparse: true`                                                                | Loose reference (could be a task id; not validated against another collection) |
| `isRead`                           | `boolean` (default `false`)                           | `isRead`                | `Boolean, default: false`                                                             |                                                                             |
| `createdAt`, `updatedAt`           | `Date`                                                | (schema timestamps)     | auto                                                                                  |                                                                             |

**Field-level decisions to ratify**

- **Compound index `{ userId: 1, createdAt: -1 }`.** Required — `findByUser` returns newest-first and is hit every 30 s by `NotificationsContext` polling. Without this index the bell becomes a bottleneck under any real user count.
- **Compound index `{ userId: 1, isRead: 1 }`.** Required for `countUnread(userId)`, which is called every 30 s alongside the list query.
- **TTL index?** Tempting (auto-expire notifications older than 90 days) but defer until we have data. Out of scope this sprint.
- **`sourceAggregateId` is intentionally untyped.** It points to a task today, but the field is generic by design so we can route activity events through this aggregate later without schema changes.

#### 2.3.4 ReminderState (new aggregate)

Today, `CheckDueRemindersUseCase` holds a `Set<string>` of already-reminded task IDs in process memory. After deployment on Render's free tier (which sleeps after 15 min idle and restarts every 24 h), this Set resets — meaning users will receive duplicate reminders for the same task each time the dyno wakes. This is the leakage the R3 status note already flags.

| New aggregate `ReminderState` | Type        | Mongoose schema field | Type                                                | Notes                                                                                              |
| ----------------------------- | ----------- | --------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `taskId`                      | `string`    | `_id`                 | `String` (the task id itself acts as the doc id)    | Naturally unique per task per reminder type; for now we only emit one type per task                |
| `remindedAt`                  | `Date`      | `remindedAt`          | `Date, required, default: () => new Date()`         | When the event was published                                                                       |
| (none)                        | n/a         | (schema timestamps)   | disabled                                            | Single-purpose record; no need for separate `createdAt` / `updatedAt`                              |

**Field-level decisions to ratify**

- **Doc `_id` = `taskId`.** Recommended — Mongo's primary key is implicitly uniquely indexed, so this satisfies the "one ReminderState per task" invariant for free, and every reminder check resolves via a single 1-doc `findById`. No separate unique index needs to be declared.
- **No `reminderType` discriminator.** Defer until we have a second reminder type (e.g. 1-hour-before vs 24-hour-before). When we add one, promote `_id` to a composite `${taskId}:${type}` or restructure as `{ taskId, type, remindedAt }` with a unique compound index.
- **Cleanup.** On task completion / deletion, `MongoTaskRepository.delete` deletes the matching `ReminderState` doc in the same operation (best-effort, non-transactional).

**Application change**: `CheckDueRemindersUseCase` takes a new `IReminderStateRepository` dependency, replaces the in-memory `Set` with `await reminderStateRepo.hasReminded(taskId)` / `markReminded(taskId)`. Behaviour identical when both impls back the same interface.

#### 2.3.5 Audit log

`AuditLogger` keeps an in-memory `AuditEvent[]`. On Render free tier, this array empties every cold start, so the `/api/v1/audit` endpoint stops being useful within hours of deployment. Options:

1. **Defer** — accept that audit is non-durable, add a comment to the response payload, revisit Sprint 12.
2. **Persist** — add `MongoAuditRepository`, change `AuditLogger` to call it on each event. Schema is trivial (`{ _id, eventType, occurredAt, payload, sourceAggregateId }` with index on `occurredAt`).

**Recommendation**: option 1 for Sprint 11 (out of scope), option 2 in Sprint 12 once we know whether R7 evidence needs durable audit. Flagging here so the deployed system's audit limitation is explicit, not surprising.

### 2.4 Connection management

New file `src/shared/infrastructure/db/connectMongo.ts`:

- Single connection per process, lazy-initialised on first use.
- Uses `mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })`.
- On connection error during startup, log and exit with non-zero code so Render reports a failed deploy rather than serving 500s.
- Graceful shutdown handler on `SIGTERM` / `SIGINT` closes the connection.

### 2.5 Local development without Atlas

A developer can still run locally with `npm run dev` and get the existing in-memory experience by **not setting `MONGODB_URI`**. The composition root in `src/index.ts` picks repos based on a `REPOSITORY_DRIVER` env var (default `memory`):

```
REPOSITORY_DRIVER=memory  // default; uses InMemory*Repository — seed data loads on startup
REPOSITORY_DRIVER=mongo   // requires MONGODB_URI; uses Mongo*Repository; seed is no-op
```

Two env vars, not one, on purpose: requiring an explicit driver means a missing `MONGODB_URI` in production fails loudly at startup instead of silently falling back to in-memory and losing every write the moment the dyno restarts.

### 2.6 Test strategy — keeping all 129 backend tests green

**The key invariant:** the existing 129 backend tests construct repositories directly via `new InMemoryUserRepository()`, `new InMemoryTaskRepository()`, etc. They do not go through the composition root, so they are immune to the new env-var-driven factory. **They continue to pass unchanged.**

What changes test-wise:

| Layer                        | Change required                                                        | Why                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Unit tests (use cases)       | None                                                                   | Already inject repos; layer is repo-agnostic                                                                              |
| Integration tests (HTTP)     | None for the 129 existing tests                                        | They wire `createApp(userRepo, taskRepo)` with in-memory repos                                                            |
| **New** Mongo repo tests     | Add ~6–8 tests per Mongo repo against `mongodb-memory-server`          | Verifies mapper round-trip, unique-email enforcement, query semantics on a real Mongo (not just the Map shim)             |
| CI                           | Single new job `npm run test:mongo` gated by an env flag               | Runs the Mongo repo tests against `mongodb-memory-server` so CI doesn't need a hosted DB                                  |

Expected new test count after Sprint 11: **~149 backend tests** (129 existing + ~20 new Mongo repo round-trip tests). Frontend unchanged (still 91).

**Why this beats a single `REPOSITORY_DRIVER` switch.** Explicit driver + presence-check on `MONGODB_URI` means three good behaviours: (a) tests automatically get in-memory because they never set the env var; (b) local dev gets in-memory by default with no setup; (c) prod gets a startup crash if `MONGODB_URI` is missing, instead of silently dropping writes.

### 2.6.1 `mongodb-memory-server` harness specifics

To make the Mongo integration tests reproducible and CI-friendly without an external dependency, the harness is constrained to these properties:

| Property                       | Decision                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package version                | `mongodb-memory-server` **v9+** (current line as of 2026; supports modern Mongo binaries and Node 18+ out of the box). Pin via `^9` so security patches apply         |
| Isolation granularity          | **Per test suite (`describe` block / file), not per test.** One in-memory server per Jest worker, one fresh database per suite. Tests inside a suite share the database |
| Cleanup between tests          | `beforeEach` runs `db.dropDatabase()` so tests within a suite still observe a clean slate without paying the binary-spin-up cost per test                              |
| Teardown                       | Jest `globalTeardown` script stops the in-memory server and removes its data directory. No orphan `mongod` processes between runs                                     |
| Binary cache                   | Cache the downloaded Mongo binary in CI under `~/.cache/mongodb-binaries` so the first download (~80 MB) is paid once per CI environment, not per run                  |
| CI job                         | Separate GitHub Actions job `mongo-integration` that runs `npm run test:mongo`. **Advisory only — does not block PR merge.** Marked `continue-on-error: true`         |
| Local invocation               | `npm run test:mongo` from repo root. First run downloads the Mongo binary; subsequent runs hit the cache                                                              |
| Expected test count            | **~20 integration tests** total: 4–5 per Mongo repo × 4 repos (User, Task, Notification, ReminderState), covering CRUD + each repo's aggregate-specific queries        |

**Why advisory not gating.** The integration tests provide signal but should not block the team from shipping unrelated PRs if `mongodb-memory-server` has a transient binary-download flake or a Mongo binary release breaks downstream. The unit/integration tests against in-memory repos remain the gating CI job — they cover behaviour, the Mongo tests cover persistence wiring.

---

## 3. Backend deployment plan (Render)

### Service configuration

| Setting                   | Value                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| Service type              | Web Service                                                        |
| Repo                      | `fit3162-cs-07/cs-07`                                              |
| Branch                    | `main`                                                             |
| Root directory            | `.` (backend lives at repo root)                                   |
| Build command             | `npm install && npm run build`                                     |
| Start command             | `npm start`                                                        |
| Node version              | 18 (matches `package.json` engines)                                |
| Auto-deploy on push       | Yes, on `main` only                                                |
| Health check path         | `/health` (new endpoint — see below)                               |
| Region                    | Singapore (closest free region to Melbourne)                       |

### Environment variables (Render dashboard)

| Name                | Value                                                                                       | Notes                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`          | `production`                                                                                |                                                                |
| `PORT`              | (Render injects this automatically; do not set manually)                                    | App already reads `process.env.PORT`                           |
| `JWT_SECRET`        | 64-char random string, generated locally with `openssl rand -hex 32`                        | Generate fresh; never reuse the dev `.env` secret              |
| `JWT_EXPIRY`        | `15m`                                                                                       | Matches current default                                        |
| `REPOSITORY_DRIVER` | `mongo`                                                                                     | Forces Mongo path; missing `MONGODB_URI` should crash startup  |
| `MONGODB_URI`       | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/club_tasks?retryWrites=true&w=majority`  | Atlas connection string with IP allowlist `0.0.0.0/0` for now  |
| `FRONTEND_ORIGIN`   | `https://cs-07.vercel.app` (or whatever Vercel assigns)                                     | Used by CORS middleware — see §5                               |

### New `/health` endpoint

Add `GET /health` returning `{ ok: true, uptime: process.uptime() }` with HTTP 200. Mounted before `authMiddleware`. Used by:

- Render's built-in health check (replaces a missed deploy detection)
- UptimeRobot keep-warm pings during demo week
- R12 evidence collection (response timestamps log uptime)

Implementation lives at `src/shared/infrastructure/http/healthRoute.ts`, wired in `app.ts` before the `/api/v1` mount.

### Cold-start mitigation

Render free tier sleeps after 15 min idle. Cold wake of this Node service is ~30–50 s, which is a poor demo experience.

**Demo-week strategy** (cheap, no code change):

1. Set up [UptimeRobot](https://uptimerobot.com) free monitor: HTTP(S) check against `https://<service>.onrender.com/health` every 5 minutes.
2. UptimeRobot doubles as the uptime evidence source for R12 — its public status page is screenshot-able for the report.
3. On demo day, manually `curl /health` 30 seconds before the live demo as a belt-and-braces wake.

**What we are NOT doing**: paying for an always-on Render plan, deploying a second "warmer" service, or implementing in-process keep-alive (which doesn't beat the dyno-level sleep policy). Keep it boring.

---

## 4. Frontend deployment plan (Vercel)

### Project configuration

| Setting              | Value                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Framework preset     | Vite                                                               |
| Repo                 | `fit3162-cs-07/cs-07`                                              |
| Branch               | `main`                                                             |
| Root directory       | `frontend`                                                         |
| Build command        | `npm run build`                                                    |
| Output directory     | `dist`                                                             |
| Install command      | `npm install`                                                      |
| Node version         | 20 (Vercel default)                                                |

### Environment variable

| Name                  | Value                                                       | Scope        |
| --------------------- | ----------------------------------------------------------- | ------------ |
| `VITE_API_BASE_URL`   | `https://<render-service>.onrender.com/api/v1`              | Production   |
| `VITE_API_BASE_URL`   | `http://localhost:3000/api/v1`                              | Preview, Dev |

The frontend already reads this at build time in `frontend/src/api/client.ts:11`. No code change needed.

### Pre-deploy gate

Before connecting Vercel, run `cd frontend && npm run build` locally on the merged-main branch. The build must succeed and the output bundle must be under the existing budget (currently 100 kB JS gzip / 5 kB CSS gzip per §current bundle in PROJECT_STATUS.md). If the gzip JS bundle has crept over 200 kB, investigate before deploying — Lighthouse R13 evidence depends on a fast initial payload.

### Custom domain

Not required. The default `cs-07.vercel.app` (or similar) URL is fine for the demo. R11 (encryption in transit) is satisfied by Vercel's automatic TLS on the default subdomain.

---

## 5. Integration concerns

### CORS

The backend's CORS middleware currently allows any origin (dev convenience). For production:

- Replace permissive CORS with `cors({ origin: process.env.FRONTEND_ORIGIN, credentials: false })`.
- `FRONTEND_ORIGIN` is set per environment (see §3 env vars).
- Reject all other origins. Preview deploys on Vercel get a per-PR URL like `cs-07-git-feature-x.vercel.app`; if we want previews to talk to prod backend, switch to an array of allowed origins or a regex. For Sprint 11, **point preview deploys at localhost backend** instead — keeps the surface tight.

### HTTPS

Vercel terminates TLS at the edge for `*.vercel.app`. Render terminates TLS at its load balancer for `*.onrender.com`. **No certificate management needed.** Both providers satisfy R11 (encryption in transit) by default.

### Cookies and storage

We do not use cookies. JWTs live in `tokenStorage` (`sessionStorage` by default, `localStorage` if "Remember me" is checked). No `SameSite` / `Secure` flag work required.

If a future sprint moves the JWT to an HttpOnly cookie, the flags become: `Secure: true, SameSite: 'None', HttpOnly: true, Domain: '<api-domain>'`. Out of scope this sprint.

### Atlas IP allowlist

Atlas M0 requires an IP allowlist. Render publishes a list of egress IPs but it is large and changes. **Set the allowlist to `0.0.0.0/0` (allow all) for this sprint** — security model relies on the username/password embedded in `MONGODB_URI` and TLS. Restrict the allowlist in Sprint 12 if we move off M0.

---

## 6. Verification checklist (post-deploy)

To be run by Thanh, signed off by Ethan, before declaring "deployed".

### End-to-end smoke (manual, ~15 min)

- [ ] Open `https://cs-07.vercel.app` — login page renders, Monash Blue theme applied
- [ ] Log in as admin seed user — redirects to dashboard
- [ ] Dashboard loads tasks + upcoming reminders card without errors in the browser console
- [ ] Create a new task with `dueDate = now + 10 min` — appears in list and on the Kanban
- [ ] Assign the new task to a member user — assignment reflects on the task detail page
- [ ] Open Kanban — drag the task from `TODO` → `IN_PROGRESS` — status persists on reload
- [ ] Sign out — redirects to login; cannot access `/dashboard` without re-auth
- [ ] Sign in as the assigned member — see the task in the member's view, with the assignee badge

### Mobile verification (the core demo blocker)

- [ ] Open `https://cs-07.vercel.app` on an actual phone (iPhone Safari + Android Chrome — Ethan and Ruizhi each test one)
- [ ] Login form usable without zoom
- [ ] Sidebar opens as drawer on mobile, closes on backdrop tap
- [ ] Create-task modal appears as bottom-sheet (drag-handle visible)
- [ ] Toast notifications span full-width on mobile

### Lighthouse audit (R13 evidence)

- [ ] Run Lighthouse against `https://cs-07.vercel.app/login` in Chrome incognito
- [ ] Performance score ≥ 90 (the report number, plus the explicit "Time to Interactive" must be under 3 s)
- [ ] Save the report HTML to `docs/evidence/lighthouse-login.html`
- [ ] Repeat for `/dashboard` (post-login) and save as `lighthouse-dashboard.html`

### Uptime monitoring (R12 evidence)

- [ ] UptimeRobot monitor created against `/health` with 5-min interval
- [ ] Public status page URL captured for the report
- [ ] After 7 days, screenshot the uptime % and attach to `docs/evidence/uptime-week.png`

---

## 7. Risk callouts

| Risk                                                                                                         | Likelihood | Impact | Mitigation                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render cold start during demo (30–50 s of blank screen)                                                      | Medium     | High   | UptimeRobot 5-min ping (§3); manual `curl` 30 s before demo; have a screen recording as fallback                                                          |
| Atlas M0 hits 512 MB limit                                                                                   | Low        | Medium | Monitor in Atlas dashboard; one notification per task * 3 users * ~5 tasks ≈ trivial volume for demo; if approached, prune notifications older than 30 d  |
| Render free tier exhausts 750 hours (~31 days continuous)                                                    | Low        | Medium | One service runs ~720 hours/month; well within. Risk only if we deploy a second service                                                                   |
| Vercel build fails because of a breaking change merged after this plan was written                           | Low        | High   | Run `cd frontend && npm run build` against the latest `main` immediately before connecting Vercel; pin the Node version                                   |
| `MONGODB_URI` leaked into the repo or PR body                                                                | Low        | Critical | Atlas allows rotating the password without redeploying. Pre-commit hygiene checks do not match URIs — Thanh must hand-check the diff before pushing       |
| Schema decision needs to change after Atlas has real data                                                    | Low        | High   | This document is the gate. Schema is reviewable in writing before any code; once data is in, changes require migration scripts (manual, error-prone)      |
| In-memory reminder dedup leaks duplicate reminders post-cold-start (the bug §2.5 fixes)                      | High pre-fix | Medium | The §2.5 `ReminderState` collection is the fix. Without it, the deployed system will spam reminders every time the dyno wakes                            |

**Rollback plan**: the localhost stack remains fully runnable throughout. If the deployed Render service fails irrecoverably during demo prep, fall back to a local `npm run dev` + screenshare for the demo. The deployed evidence (Lighthouse, uptime monitor) accumulates regardless of the live demo's transport.

---

## 8. Execution order and time estimates

Sequential phases; each phase's exit criterion must be met before the next begins.

| Phase | Owner   | Work                                                                                                              | Estimate  | Exit criterion                                                                                  |
| ----- | ------- | ----------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| 1     | Thanh   | Atlas M0 cluster + `MongoUserRepository` / `MongoTaskRepository` / `MongoNotificationRepository` / `MongoReminderStateRepository` + composition root switch + mapper round-trip tests | ~4 h      | `REPOSITORY_DRIVER=mongo MONGODB_URI=... npm start` boots locally, seed runs, full E2E by curl  |
| 2     | Thanh   | Render web service + `/health` route + env vars + first successful deploy from `main`                              | ~2 h      | `https://<service>.onrender.com/health` returns 200; `/api/v1/auth/login` works against deployed backend |
| 3     | Thanh   | Vercel project + `VITE_API_BASE_URL` + first successful deploy; CORS lock-down on backend                         | ~2 h      | Vercel URL loads the login page, login round-trip succeeds against the Render backend           |
| 4     | Thanh + Ethan | Lighthouse audit + mobile verification on real devices                                                       | ~1 h      | Lighthouse score captured; smoke checklist (§6) fully checked                                   |
| 5     | Ethan   | UptimeRobot setup + 7-day observation window                                                                       | ~30 m active, 7 days passive | Uptime evidence screenshot ≥ 95 %                                            |

**Total active time: ~10 hours** spread across one week of elapsed time. Phase 5 runs in the background while the team finalises the report.

---

## 9. Team responsibilities

| Person   | Sprint 11 work                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Thanh    | Phases 1–4: Atlas, Mongoose repos, Render, Vercel, integration testing, CORS lock-down                            |
| Ruizhi   | Continues UI polish work in parallel — no deployment work. Helps with one mobile-device verification in Phase 4. |
| Ethan    | Phase 5: UptimeRobot setup + 7-day uptime tracking. README updates (deployment URLs, env var docs). Helps with the second mobile-device verification in Phase 4. |

---

## Open questions for review — defaults proposed, awaiting team sign-off

Each question has a **default answer** the plan will proceed with unless explicitly overridden in PR comments. To reject a default, leave a comment on this PR naming the question number and proposing an alternative.

### Q1. Mongoose or native MongoDB driver?

**Default: Mongoose.** Schema-as-documentation pays off during a fast sprint where the schema review (§2.3) IS the contract — declaring fields, indexes, and validators in one place makes review tractable. The native `mongodb` driver is smaller but pushes validation into application code where it scatters across the four Mongo repos.

### Q2. Atlas region

**Default: Sydney (`ap-southeast-2`).** Lowest Melbourne latency, same continent as the demo audience, free on M0. Render's closest free region is Singapore, so we pay an extra ~50 ms hop on every Render → Atlas query — acceptable, as the slow path is Render's cold start (30–50 s), not steady-state DB latency (sub-100 ms).

### Q3. Audit log persistence (§2.6)

**Default: DEFER to post-capstone.** R7 (RBAC) evidence is satisfied by the middleware + the 401/403 test assertions across the integration suite, not by audit history. The deployed `/api/v1/audit` endpoint will return only events since the last Render restart; this limitation will be called out in the final report's NFR section. Promoting durable audit to Sprint 11 scope would double Phase 1's scope for a benefit the rubric does not require.

### Q4. Account ownership strategy (§1.5)

**Default: shared team Gmail** (e.g. `fit3162.s2cs07@gmail.com`) owns Atlas, Render, Vercel, and UptimeRobot. Thanh's Monash student email verifies the GitHub Student Pack separately to apply bonus credits. This pattern keeps the deployment alive past graduation for portfolio use; using anyone's Monash student email as primary would lose admin access the moment Monash deactivates the account.

### Q5. Schema decisions sign-off (§2.3 per-aggregate "Field-level decisions to ratify")

**Default: walk through the four blocks in a 30-min team sync this week** (User, Task, Notification, ReminderState). Schemas are cheap to change now and expensive to change after Atlas has real data — review must happen synchronously, not over async PR comments, because the index decisions trade off against each other (e.g. `{assigneeId, status}` compound vs separate `status` index — pick one, not both).

**Sync proposed time:** Wed of plan-merge week, 30 min — Thanh to send invite once this PR is approved in principle.
