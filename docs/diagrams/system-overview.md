# System Overview — Elevator Pitch

> A one-screen visual for tutors, stakeholders, and teammates. Shows what the app does, not how it's built.

```mermaid
---
title: Monash Club Task Manager — What Does It Do?
---
flowchart LR
    classDef persona fill:#CCE5FF,stroke:#4A90D9,stroke-width:3px,color:#1a1a1a,font-size:14px
    classDef feature fill:#C3FCD0,stroke:#27AE60,stroke-width:2px,color:#1a1a1a
    classDef data fill:#FFD6A5,stroke:#E67E22,stroke-width:2px,color:#1a1a1a
    classDef planned fill:#E5E5E5,stroke:#7F8C8D,stroke-width:2px,stroke-dasharray:5 5,color:#666

    subgraph Users["👥 Who Uses It?"]
        Admin["🛡️ Club Admin\n· Creates tasks\n· Assigns to members\n· Manages roles\n· Views audit log"]
        Member["👤 Team Member\n· Views assigned tasks\n· Updates task status\n· Tracks deadlines"]
    end

    subgraph App["📱 What Can They Do?"]
        direction TB

        subgraph TaskMgmt["📋 Task Management"]
            Create["✏️ Create Tasks\nwith title, priority, deadline"]
            Assign["📌 Assign Tasks\nto team members"]
            Kanban["📊 Kanban Board\nToDo → In Progress → Done"]
            Filter["🔍 Filter & Search\nby status, priority, assignee"]
        end

        subgraph Access["🔐 Access & Security"]
            Login["🔑 Login / Register\nJWT authentication"]
            Roles["🛡️ Role-Based Access\nAdmin vs Member permissions"]
            Audit["📝 Audit Trail\nevery action is logged"]
        end

        subgraph Planned["🚧 Coming Soon"]
            Clubs["🏛️ Club Management\ncreate clubs, manage members"]
            Reminders["🔔 Reminders\ndeadline notifications"]
            Files["📎 File Attachments\nupload docs to tasks"]
            Search["🔎 Full-Text Search\nsearch task content"]
        end
    end

    subgraph Backend["🗄️ Behind the Scenes"]
        API["⚡ REST API\nExpress + TypeScript"]
        DB["💾 Data Store\nIn-Memory → MongoDB"]
        CI["🔄 CI/CD\nGitHub Actions"]
        Docker["🐳 Docker\ncontainerised deployment"]
    end

    %% ── Users to Features ──
    Admin ==>|"full access"| TaskMgmt
    Admin ==>|"manages"| Access
    Member ==>|"view & update\nown tasks"| TaskMgmt
    Member -->|"login"| Login

    %% ── Features to Backend ──
    TaskMgmt ==>|"REST calls"| API
    Access ==>|"JWT auth"| API
    API ==>|"reads/writes"| DB

    class Admin,Member persona
    class Create,Assign,Kanban,Filter,Login,Roles,Audit feature
    class API,DB,CI,Docker data
    class Clubs,Reminders,Files,Search planned
```

### Quick Facts

| | |
|---|---|
| **What** | Task management app for Monash University student clubs |
| **Who** | Club admins create and assign tasks; members track and complete them |
| **Why** | Clubs need a simple way to organise events, delegate work, and track progress |
| **How** | Web app with Kanban board, role-based access, and audit logging |
| **Status** | Backend complete, frontend in development |

### RTM Feature Map

| Feature | RTM | Status |
|---------|-----|--------|
| ✏️ Create / Edit / Delete Tasks | R1 | ✅ Done |
| 📌 Assign Tasks to Members | R2 | ✅ Done |
| 📅 Deadlines | R3 | 🚧 Stored, no reminders yet |
| 📊 Kanban Status View | R4 | 🚧 Backend done, needs UI |
| 🔍 Filter & Search | R5 | 🚧 Filters done, no full-text |
| 📎 File Attachments | R6 | ❌ Not started |
| 🛡️ Role-Based Access | R7 | ✅ Done |
| 📱 Responsive Design | R8 | ❌ Not started |
| ⚡ Page Load < 3s | R13 | ❌ Pending frontend |
