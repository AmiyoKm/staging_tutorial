# Todo Backend Design

## Overview

A production-ready todo API built with Bun and ElysiaJS, designed to learn CI/CD, staging environments, and best practices.

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT using `@elysiajs/jwt`
- **Validation**: TypeBox schemas
- **Testing**: Bun test runner
- **CI/CD**: GitHub Actions with GitFlow
- **Containerization**: Docker multi-stage builds

## Project Structure

```
staging_tutorial/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── config/
│   │   │   ├── database.ts       # Drizzle connection
│   │   │   └── env.ts            # Environment validation
│   │   ├── plugins/
│   │   │   ├── auth.ts           # JWT plugin + auth routes
│   │   │   ├── users.ts          # User CRUD
│   │   │   └── todos.ts          # Todo CRUD
│   │   ├── routes/
│   │   │   ├── auth.routes.ts    # POST /auth/register, /auth/login
│   │   │   └── todo.routes.ts    # CRUD endpoints
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts # JWT verification
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   └── todos.ts
│   │   │   └── migrations/
│   │   └── types/
│   │       └── schemas.ts        # TypeBox schemas
│   ├── test/
│   │   ├── auth.test.ts
│   │   └── todos.test.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Database Schema

### Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| email | varchar(255) | UNIQUE, NOT NULL |
| password_hash | varchar(255) | NOT NULL |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |

### Todos Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| user_id | integer | FOREIGN KEY → users.id, NOT NULL, INDEXED |
| title | varchar(255) | NOT NULL |
| description | text | |
| due_date | timestamp | NULLABLE |
| priority | enum | 'low', 'medium', 'high', DEFAULT 'medium' |
| completed | boolean | DEFAULT false, INDEXED |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |

### Indexes

- `users_email_unique` on `users(email)`
- `todos_user_id_index` on `todos(user_id)`
- `todos_due_date_index` on `todos(due_date)`
- `todos_completed_index` on `todos(completed)`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and return JWT |
| GET | /api/auth/me | Get current user profile |

### Todos (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos | List user's todos |
| POST | /api/todos | Create new todo |
| GET | /api/todos/:id | Get single todo |
| PUT | /api/todos/:id | Update todo |
| DELETE | /api/todos/:id | Delete todo |
| PATCH | /api/todos/:id/complete | Mark todo as completed |

### Query Parameters

- `?completed=true` - Filter by completion status
- `?priority=high` - Filter by priority
- `?due_before=2025-01-31` - Filter by due date

## Authentication Flow

### Registration

1. User sends email + password
2. Validate email format and password strength (min 8 chars)
3. Check if email exists (409 if so)
4. Hash password with bcrypt
5. Create user
6. Generate JWT (exp: 7 days)
7. Return user + token

### Login

1. User sends email + password
2. Find user by email (401 if not found)
3. Compare password with hash
4. Generate JWT (exp: 7 days)
5. Return user + token

### Protected Routes

- JWT sent via `Authorization: Bearer <token>` header
- Middleware verifies token and extracts `userId`
- 401 for invalid/missing tokens
- 403 for accessing other users' resources

## CI/CD Pipeline

### GitFlow Workflow

| Branch | Purpose | Deployment |
|--------|---------|------------|
| `master` | Production | Production environment |
| `develop` | Integration | Staging environment |
| `feature/*` | Features | CI checks only |
| `release/*` | Release prep | CI checks |
| `hotfix/*` | Emergency fixes | CI + production |

### Workflows

**ci.yml** - Runs on all PRs
- Type check
- Lint
- Run tests
- Build Docker image (dry-run)

**deploy-staging.yml** - Push to `develop`
- Build and push image (`amiyokm/todo-backend:staging`)
- Deploy to staging
- Run smoke tests

**deploy-production.yml** - Push to `master`
- Create git tag
- Build and push image (`amiyokm/todo-backend:production`, `:latest`)
- Deploy to production
- Run health checks
- Requires approval

### GitHub Secrets

- `DOCKER_REGISTRY_URL`
- `DOCKER_USERNAME`, `DOCKER_PASSWORD`
- `STAGING_HOST`, `PRODUCTION_HOST`
- `DATABASE_URL` (staging/production)
- `JWT_SECRET` (staging/production)

## Docker Configuration

### Dockerfile (Multi-stage)

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install
RUN cd /temp/dev && bun pm bin > /tmp/bunpm
RUN mv /temp/dev/node_modules /temp/dev/package.json /temp/dev/bun.lock* /app/

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build
ENV NODE_ENV production
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

### Docker Compose (Local)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: todo_db
      POSTGRES_USER: todo_user
      POSTGRES_PASSWORD: todo_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://todo_user:todo_pass@postgres:5432/todo_db
      JWT_SECRET: local_dev_secret
      NODE_ENV: development
    depends_on:
      - postgres
    volumes:
      - ./backend/src:/app/src

volumes:
  postgres_data:
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for signing JWTs |
| NODE_ENV | development | staging | production |
| PORT | Server port (default: 3000) |

## Best Practices

1. Type-safe database operations with Drizzle ORM
2. Runtime and compile-time validation with TypeBox
3. Environment-based configuration
4. UUID for todo IDs (prevents enumeration)
5. Bcrypt password hashing (cost factor: 10)
6. Multi-stage Docker builds (smaller images)
7. Automated testing in CI pipeline
8. Staging environment before production
9. GitFlow branching strategy
10. Never commit secrets or .env files
