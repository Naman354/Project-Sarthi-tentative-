# Project Sarthi — Software Understanding Platform

> **"Git remembers what changed. Project Sarthi remembers what the software means."**

Project Sarthi is an open-source **Software Understanding Platform** designed to solve developer context loss. As software codebases grow, understanding becomes fragmented across source code, git commits, documentation, schemas, and memory. Sarthi continuously parses repositories, models their architectural topologies as interactive knowledge graphs, detects structural anomalies, and provides returning engineers with instant context briefings.

---

## Architecture Overview

```mermaid
graph TD
    Client[Next.js 15 Web Workspace] -->|REST API / JWT| API[Express TypeScript Backend]
    API -->|ORM Queries| DB[(PostgreSQL + Prisma)]
    API -->|Git Clone --depth 1| Storage[Local Repository Storage]
    Storage -->|AST Visitors| Parsers[Multi-Framework Parser Engine]
    Parsers -->|Normalized Entities| GraphBuilder[Graph Builder & Validator]
    GraphBuilder -->|Project Graph Nodes & Edges| DB
    GraphBuilder -->|Topology & Metrics| AnalysisEngine[Analysis Engine]
    AnalysisEngine -->|Health Radar, Insights & Briefings| DB
```

### Core System Layers

1. **Frontend Workspace (`apps/web`)**: Next.js 15, React 19, Tailwind CSS, canvas topology visualization with pan/zoom/minimap, Subgraph Focus Mode, and global Omnibar search (`Ctrl+K` / `Cmd+K`).
2. **Backend API (`apps/api`)**: Express 5, TypeScript, Zod schema validation, JWT auth with refresh rotation, and REST endpoints.
3. **Database Layer**: PostgreSQL 16 with Prisma ORM schema modeling users, projects, analyses, graph snapshots, modules, and health records.
4. **AST Parser Engine**: Babel parser visitors for:
   - **Express**: HTTP routes, controllers, services, middleware, and request flow.
   - **React**: Functional components, props, and hooks (`useState`, `useEffect`, etc.).
   - **Prisma**: Data models, scalar/relational fields, and foreign keys.
   - **Markdown**: Architecture documentation and README sections.
5. **Graph Builder & Validator**: Transforms AST entities into a typed **Project Graph** (`CALLS`, `IMPORTS`, `DEFINES`, `USES_MODEL`, `DOCUMENTS`) with cycle protection and versioned snapshots.
6. **Analysis Engine**: Deterministic calculation of health metrics (scores, missing documentation, orphan files, circular dependencies) and **"Resume Session"** briefings.

---

## Version 1 Implementation Milestones

Version 1 MVP represents ten vertically delivered implementation milestones:

| Milestone                      | Scope              | Deliverables & Status                                                                |
| :----------------------------- | :----------------- | :----------------------------------------------------------------------------------- |
| **M1: Foundation**             | Infrastructure     | Monorepo workspaces, Express backend, Next.js frontend, PostgreSQL, Prisma ORM.      |
| **M2: Authentication**         | Security           | JWT access/refresh token rotation, bcrypt password hashing, auth middleware.         |
| **M3: Project Management**     | Core CRUD          | Project creation, GitHub URL binding, project listing, and ownership isolation.      |
| **M4: Repository Integration** | Ingestion          | GitHub URL validation, shallow cloning (`git clone --depth 1`), metadata extraction. |
| **M5: Parser Engine**          | AST Extraction     | Babel visitors for Express routes, React components, Prisma schemas & Markdown docs. |
| **M6: Graph Builder**          | Topology           | Entity-to-node transformation, typed relationships, validation, graph versioning.    |
| **M7: Analysis Engine**        | Insights           | Health scores (0–100), circular dependency radar, orphan detection, Resume Session.  |
| **M8: Visualization**          | UI / UX            | Overview dashboard, canvas graph viewer, Context Panel drawer, Module Explorer.      |
| **M9: Search & Polish**        | Usability          | Global Omnibar (`Cmd+K`), Subgraph Focus Mode, filter presets, loading skeletons.    |
| **M10: Testing & Deployment**  | Production Release | Automated unit & AST parser tests, Docker Compose orchestration, GitHub Actions CI.  |

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher
- **Git**: Installed and available on your system `PATH`
- **PostgreSQL**: v15 or v16 (or Docker)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Naman354/Project-Sarthi-tentative-.git
cd Project-Sarthi-tentative-
npm install
```

### 2. Configure Environment Variables

Create environment files for the API and Web apps:

**`apps/api/.env`**:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/project_sarthi?schema=public"
JWT_ACCESS_SECRET="your_very_secure_long_access_secret_min_32_characters_123456"
JWT_REFRESH_SECRET="your_very_secure_long_refresh_secret_min_32_characters_789012"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
```

**`apps/web/.env.local`**:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 3. Initialize Database & Run Migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
cd ../..
```

### 4. Run Development Servers

Run both services concurrently:

```bash
# Terminal 1: Backend API
npm run dev:api

# Terminal 2: Frontend Web App
npm run dev:web
```

- Web App: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## Production Deployment (Docker Compose)

To run the complete production stack (PostgreSQL + API + Next.js Web) in isolated containers:

```bash
docker compose up --build -d
```

To view logs or stop services:

```bash
docker compose logs -f
docker compose down
```

---

## Verification & Automated Testing

Project Sarthi includes test suites covering AST parsers, graph builder algorithms, and analysis metrics:

```bash
# Run automated test suite
npm run test

# Run ESLint quality checks
npm run lint

# Check code formatting style
npm run format:check

# Auto-format all code with Prettier
npm run format
```

---

## Key Features Guide

### 1. Repository Analysis

Connect any public GitHub repository. Click **"Analyze Codebase"** to trigger shallow cloning, AST parsing, topological graph construction, and metric scoring.

### 2. Interactive Knowledge Graph

- **Pan & Zoom**: Navigate dense topologies with mouse drag, wheel zoom, or the floating zoom controls.
- **Filter Presets**: Switch instantly between _All_, _API Flow_ (Routes $\rightarrow$ Controllers $\rightarrow$ Services), _Database_ (Services $\rightarrow$ Models), _Frontend_ (Components $\rightarrow$ Pages), and _At Risk_ views.
- **Context Panel**: Click any node to slide open its source file location, inbound/outbound connection counts, and code details.

### 3. Subgraph Focus Mode

When inspecting complex codebases, click **"Focus Subgraph"** on any node to isolate its direct 1-hop dependencies and filter out irrelevant noise.

### 4. Global Omnibar (`Ctrl+K` / `Cmd+K`)

Press `Ctrl+K` from anywhere in a project to search across modules, routes, database models, components, documentation, or insights, and jump straight to that node on the canvas.

### 5. Resume Session Briefing

Returning to a codebase after weeks away? The **Overview Tab** answers:

- _Where was I working?_
- _What did the recent analysis detect?_
- _What architectural dependencies exist?_
- _What should I tackle next?_

---

## What Lies Ahead (Version 2 Roadmap)

Following the completion of Version 1 (Milestones 1–10), future versions will focus on:

- **AI-Assisted Understanding**: Natural language Q&A about architecture powered by deterministic Project Graph groundings.
- **Live Synchronization & Webhooks**: Automatic incremental graph updates whenever commits are pushed.
- **Multi-Repository Architecture**: Cross-repository dependency mapping for microservice systems.
- **VS Code / IDE Extension**: Visualizing architectural caller/callee context right inside your code editor.
- **Architecture CI Guardrails**: Automated quality gates that prevent circular dependencies or domain boundary leaks in pull requests.

---

## License

ISC License. Built with discipline according to the Project Sarthi Technical Design Document.
