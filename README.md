# Todo API

A production-ready todo API built with Bun, ElysiaJS, and PostgreSQL.

## Tech Stack

- Bun runtime
- ElysiaJS framework
- PostgreSQL with Drizzle ORM
- JWT authentication
- Docker

## Quick Start

### Local Development

1. Start services:
```bash
docker-compose up -d
```

2. Run migrations:
```bash
cd backend
bun run db:generate
bun run db:migrate
```

3. Start dev server:
```bash
bun run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Todos (Protected)
- `GET /api/todos` - List todos
- `POST /api/todos` - Create todo
- `GET /api/todos/:id` - Get todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/:id/complete` - Mark complete

## Development

### Run tests
```bash
cd backend
bun test
```

### Type check
```bash
bun run typecheck
```

### Generate migrations
```bash
bun run db:generate
bun run db:migrate
```

## CI/CD

- CI runs on all PRs
- Staging deploys from `develop` branch
- Production deploys from `master` branch (GitFlow)
