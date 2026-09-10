# Clipping Tool

A full-stack clipping & note-saving application.

## Architecture

```
frontend (Next.js 14 + TypeScript)  →  REST API  →  backend (NestJS + TypeScript)  →  SQLite
```

| Layer    | Tech                     | Port |
|----------|--------------------------|------|
| Frontend | Next.js 14, App Router   | 3000 |
| Backend  | NestJS, TypeORM, SQLite  | 3001 |

---

## Getting Started

### Backend

```bash
cd backend
npm install
# copy env
cp .env.example .env
npm run start:dev
# → http://localhost:3001/api
```

### Frontend

```bash
cd frontend
npm install
# copy env
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

---

## API Endpoints

| Method | Path               | Description          |
|--------|--------------------|----------------------|
| GET    | /api/clips         | List clips (paged)   |
| GET    | /api/clips/:id     | Get clip by ID       |
| POST   | /api/clips         | Create a clip        |
| PATCH  | /api/clips/:id     | Update a clip        |
| DELETE | /api/clips/:id     | Delete a clip        |

### Example request

```bash
curl -X POST http://localhost:3001/api/clips \
  -H "Content-Type: application/json" \
  -d '{"title":"My first clip","content":"Hello world","url":"https://example.com","tags":["demo"]}'
```

---

## Project Structure

```
clipping_tool/
├── frontend/          # Next.js 14 app (port 3000)
│   ├── app/           # App Router pages & layouts
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # API client (lib/api.ts)
│   ├── services/      # Per-resource service wrappers
│   ├── types/         # Shared TypeScript types
│   └── styles/        # Additional CSS
│
├── backend/           # NestJS API (port 3001)
│   └── src/
│       ├── modules/clips/  # Clips CRUD feature
│       ├── common/         # Global filters & pipes
│       ├── config/         # Config namespaces
│       ├── guards/         # Auth guards
│       ├── middleware/      # HTTP middleware
│       └── utils/          # Helpers
│
└── README.md
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable              | Default                    | Description             |
|-----------------------|----------------------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001`    | Backend API base URL    |

### Backend (`backend/.env`)
| Variable      | Default        | Description                  |
|---------------|----------------|------------------------------|
| `PORT`        | `3001`         | NestJS listening port        |
| `DB_TYPE`     | `better-sqlite3` | Database type              |
| `DB_DATABASE` | `db.sqlite`    | SQLite database file path    |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin  |
