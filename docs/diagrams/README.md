# Diagrams

Architecture and design diagrams for the Monash Club Task Manager, written in [Mermaid](https://mermaid.js.org/).

## How to View

These diagrams render automatically in:

- **GitHub** — just open the `.md` file in the browser
- **VS Code** — install the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension

**Recommended VS Code extension:** `bierner.markdown-mermaid`

## Diagram Index

| File | Description |
|------|-------------|
| [system-overview.md](system-overview.md) | One-screen elevator pitch — who uses it, what it does, feature status |
| [architecture.md](architecture.md) | High-level system architecture — clients, backend modules, data layer |
| [backend-modules.md](backend-modules.md) | Onion architecture layers per module — Identity, Task, Shared |
| [request-flow.md](request-flow.md) | Sequence diagrams — Login, Create Task, Assign Task (with RBAC) |
| [database.md](database.md) | Entity relationship diagram + field reference tables |

## Colour Convention

All diagrams use a consistent colour palette:

| Colour | Hex | Meaning |
|--------|-----|---------|
| Light blue | `#CCE5FF` | Clients / user-facing |
| Light purple | `#E0C3FC` | API routes / middleware |
| Light green | `#C3FCD0` | Application layer / features |
| Light yellow | `#FFF2B3` | Domain layer / shared services |
| Light orange | `#FFD6A5` | Infrastructure / data stores |
| Light grey (dashed) | `#E5E5E5` | Planned / not yet built |

## Keeping Diagrams Updated

After completing any significant task (new feature, new module, schema change, new API endpoint), update the relevant diagram. Each diagram file has a reminder at the top.
