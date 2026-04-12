# System Architecture

> Keep this in sync with code changes. Update when adding modules, external services, or infrastructure components.

```mermaid
---
title: Monash Club Task Manager — System Architecture
---
flowchart TB
    %% ── Colour palette ──
    classDef client fill:#CCE5FF,stroke:#4A90D9,stroke-width:2px,color:#1a1a1a
    classDef route fill:#E0C3FC,stroke:#9B59B6,stroke-width:2px,color:#1a1a1a
    classDef app fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef domain fill:#FFF2B3,stroke:#F1C40F,stroke-width:2px,color:#1a1a1a
    classDef infra fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef external fill:#E5E5E5,stroke:#7F8C8D,stroke-width:2px,color:#1a1a1a
    classDef planned fill:#E5E5E5,stroke:#7F8C8D,stroke-width:2px,stroke-dasharray:5 5,color:#999

    subgraph Clients["👤 Clients"]
        Browser["🌐 Browser"]
        Postman["🧪 Postman / curl"]
    end

    subgraph Backend["⚙️ Backend — Express + TypeScript"]
        direction TB

        subgraph Middleware["🔐 Middleware Layer"]
            Auth["authMiddleware\n(JWT verify)"]
            RBAC["requireRole\n(ADMIN / MEMBER)"]
            Logger["requestLogger"]
            ErrHandler["errorHandler"]
        end

        subgraph BuiltModules["📦 Modules (Built)"]
            Identity["✅ Identity Module\nRegister · Login · JWT"]
            TaskMod["✅ Task Module\nCRUD · Assign · Status"]
            Audit["✅ Audit Module\nEvent log · Admin view"]
        end

        subgraph PlannedModules["📦 Modules (Planned)"]
            Club["❌ Club Module\nClub CRUD · Members"]
            Notification["❌ Notification Module\nReminders · Alerts"]
        end

        subgraph SharedLayer["🔧 Shared Infrastructure"]
            EventBus["EventBus\n(Node EventEmitter)"]
            AuditLogger["AuditLogger\n(event subscriber)"]
            ApiResponse["ApiResponse\n(envelope helper)"]
        end
    end

    subgraph DataLayer["🗄️ Data Layer"]
        InMemory["✅ In-Memory Repositories\n(Map-based, current)"]
        MongoDB["❌ MongoDB\n(planned — Mongoose)"]
    end

    %% ── Client to Backend ──
    Browser -->|"HTTP REST\nJSON body"| Auth
    Postman -->|"HTTP REST\nJSON body"| Auth

    %% ── Middleware chain ──
    Auth -->|"Bearer JWT\nattach user"| RBAC
    RBAC -->|"role check\npassed"| BuiltModules
    Logger -.->|"logs every\nrequest"| Backend
    ErrHandler -.->|"catches thrown\nerrors"| ApiResponse

    %% ── Modules to Shared ──
    Identity -->|"publishes events"| EventBus
    TaskMod -->|"publishes events"| EventBus
    EventBus -->|"notifies"| AuditLogger
    Identity -->|"formats response"| ApiResponse
    TaskMod -->|"formats response"| ApiResponse
    Audit -->|"reads from"| AuditLogger

    %% ── Modules to Data ──
    Identity ==>|"IUserRepository"| InMemory
    TaskMod ==>|"ITaskRepository"| InMemory
    InMemory -.->|"swap via\nrepository pattern"| MongoDB

    %% ── Apply styles ──
    class Browser,Postman client
    class Auth,RBAC,Logger,ErrHandler route
    class Identity,TaskMod,Audit app
    class EventBus,AuditLogger,ApiResponse domain
    class InMemory infra
    class MongoDB,Club,Notification planned
```

### Legend

| Colour | Meaning |
|--------|---------|
| 🟦 Light blue | Client / consumer |
| 🟪 Light purple | API routes / middleware |
| 🟩 Light green | Application modules |
| 🟨 Light yellow | Shared / domain services |
| 🟧 Light orange | Data infrastructure |
| ⬜ Grey dashed | Planned / not yet built |
