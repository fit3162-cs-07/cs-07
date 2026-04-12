# Backend Module Architecture — Onion Layers

> Keep this in sync with code changes. Update when adding new modules, use cases, or domain entities.

## Dependency Rule

```mermaid
---
title: Onion Architecture — Dependency Direction
---
flowchart LR
    classDef infra fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef app fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef domain fill:#FFF2B3,stroke:#F1C40F,stroke-width:2px,color:#1a1a1a

    I["🌐 Infrastructure\n(routes, repos, middleware)"] ==>|"depends on"| A["⚙️ Application\n(use cases, DTOs)"] ==>|"depends on"| D["🧠 Domain\n(entities, interfaces, events)"]

    class I infra
    class A app
    class D domain
```

---

## Identity Module

```mermaid
---
title: 🔐 Identity Module — Onion Layers
---
flowchart TB
    classDef infra fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef app fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef domain fill:#FFF2B3,stroke:#F1C40F,stroke-width:2px,color:#1a1a1a

    subgraph InfraLayer["🌐 Infrastructure"]
        Routes["identityRoutes.ts\nPOST /auth/register\nPOST /auth/login"]
        RepoImpl["InMemoryUserRepository.ts\n(Map-based store)"]
    end

    subgraph AppLayer["⚙️ Application"]
        Register["RegisterUseCase.ts\n· validate input (Zod)\n· hash password (bcrypt)\n· save user"]
        Login["LoginUseCase.ts\n· verify credentials\n· sign JWT token"]
        DTOs["RegisterDTO.ts\nLoginDTO.ts"]
    end

    subgraph DomainLayer["🧠 Domain"]
        User["User.ts\n· id · email · name\n· passwordHash · role"]
        Role["Role.ts\nADMIN | MEMBER"]
        IUserRepo["IUserRepository.ts\nfindByEmail() · findById()\nsave() · findAll()"]
    end

    %% ── Infrastructure → Application ──
    Routes -->|"maps req.body\nto DTO"| Register
    Routes -->|"maps req.body\nto DTO"| Login
    Routes -.->|"uses schemas"| DTOs

    %% ── Application → Domain ──
    Register -->|"creates"| User
    Register -->|"calls"| IUserRepo
    Login -->|"reads"| User
    Login -->|"calls"| IUserRepo

    %% ── Infrastructure implements Domain ──
    RepoImpl -.->|"implements"| IUserRepo

    class Routes,RepoImpl infra
    class Register,Login,DTOs app
    class User,Role,IUserRepo domain
```

---

## Task Module

```mermaid
---
title: 📋 Task Module — Onion Layers
---
flowchart TB
    classDef infra fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef app fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef domain fill:#FFF2B3,stroke:#F1C40F,stroke-width:2px,color:#1a1a1a

    subgraph InfraLayer["🌐 Infrastructure"]
        Routes["taskRoutes.ts\nGET · POST · PUT · DELETE\nPATCH /assign · /status"]
        RepoImpl["InMemoryTaskRepository.ts\n(Map-based store)"]
    end

    subgraph AppLayer["⚙️ Application — Use Cases"]
        Create["CreateTaskUseCase.ts"]
        Update["UpdateTaskUseCase.ts"]
        Delete["DeleteTaskUseCase.ts"]
        Assign["AssignTaskUseCase.ts"]
        Status["ChangeTaskStatusUseCase.ts"]
        GetAll["GetTasksUseCase.ts"]
        GetOne["GetTaskByIdUseCase.ts"]
        DTOs["CreateTaskDTO.ts\nUpdateTaskDTO.ts\nAssignTaskDTO.ts"]
    end

    subgraph DomainLayer["🧠 Domain"]
        Task["Task.ts\n· id · title · description\n· status · priority\n· assigneeId · dueDate\n· createdBy · clubId"]
        TaskStatus["TaskStatus.ts\nTODO | IN_PROGRESS | DONE"]
        TaskPriority["TaskPriority.ts\nLOW | MEDIUM | HIGH"]
        ITaskRepo["ITaskRepository.ts\nfindAll() · findById()\nsave() · update() · delete()\nfindByAssignee()"]
        Events["Domain Events\nTaskCreatedEvent.ts\nTaskAssignedEvent.ts\nTaskStatusChangedEvent.ts\nTaskDeletedEvent.ts"]
    end

    %% ── Infrastructure → Application ──
    Routes -->|"maps req.body\nto DTO"| Create
    Routes -->|"delegates"| Update
    Routes -->|"delegates"| Delete
    Routes -->|"delegates"| Assign
    Routes -->|"delegates"| Status
    Routes -->|"delegates"| GetAll
    Routes -->|"delegates"| GetOne
    Routes -.->|"uses schemas"| DTOs

    %% ── Application → Domain ──
    Create -->|"creates"| Task
    Create -->|"calls"| ITaskRepo
    Create -.->|"publishes"| Events
    Assign -->|"calls"| ITaskRepo
    Assign -.->|"publishes"| Events
    Status -->|"calls"| ITaskRepo
    Status -.->|"publishes"| Events
    Delete -->|"calls"| ITaskRepo
    Delete -.->|"publishes"| Events
    Update -->|"calls"| ITaskRepo
    GetAll -->|"calls"| ITaskRepo
    GetOne -->|"calls"| ITaskRepo

    %% ── Infrastructure implements Domain ──
    RepoImpl -.->|"implements"| ITaskRepo

    class Routes,RepoImpl infra
    class Create,Update,Delete,Assign,Status,GetAll,GetOne,DTOs app
    class Task,TaskStatus,TaskPriority,ITaskRepo,Events domain
```

---

## Shared Module

```mermaid
---
title: 🔧 Shared Module — Cross-Cutting Concerns
---
flowchart TB
    classDef infra fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef app fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef domain fill:#FFF2B3,stroke:#F1C40F,stroke-width:2px,color:#1a1a1a

    subgraph InfraLayer["🌐 Infrastructure"]
        AuthMW["authMiddleware.ts\n(JWT verification)"]
        RoleMW["requireRole.ts\n(RBAC guard)"]
        ErrMW["errorHandler.ts\n(global catch)"]
        LogMW["requestLogger.ts\n(HTTP logging)"]
        AuditLog["AuditLogger.ts\n(event subscriber → store)"]
        ApiRes["ApiResponse.ts\n(sendSuccess / sendError)"]
    end

    subgraph AppLayer["⚙️ Application"]
        EventBus["EventBus.ts\nIEventBus interface\nNodeEventBus implementation"]
        UseCase["UseCase.ts\nbase interface"]
    end

    subgraph DomainLayer["🧠 Domain"]
        Entity["Entity.ts\nbase class (id, timestamps)"]
        DomEvent["DomainEvent.ts\neventType · aggregateType\naggregateId · actor\ntimestamp · payload"]
        AuditEv["AuditEvent.ts\nextends DomainEvent + id"]
    end

    %% ── Infrastructure → Application ──
    AuditLog -->|"subscribes via"| EventBus

    %% ── Application → Domain ──
    EventBus -->|"publishes/handles"| DomEvent

    class AuthMW,RoleMW,ErrMW,LogMW,AuditLog,ApiRes infra
    class EventBus,UseCase app
    class Entity,DomEvent,AuditEv domain
```
