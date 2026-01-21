# Todo Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready todo API with Bun + ElysiaJS, PostgreSQL, JWT auth, and CI/CD pipeline for learning staging environments.

**Architecture:**
- Modular ElysiaJS plugins for each feature (auth, todos, users)
- Drizzle ORM for type-safe database operations
- JWT authentication with Authorization headers
- TypeBox schemas for request/response validation
- GitHub Actions with GitFlow (develop → staging, master → production)

**Tech Stack:**
- Bun 1.x runtime
- ElysiaJS framework
- PostgreSQL 16
- Drizzle ORM
- @elysiajs/jwt
- bcryptjs for password hashing
- Docker multi-stage builds
- GitHub Actions CI/CD

---

## Task 1: Project Foundation Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.gitignore`
- Create: `backend/.env.example`
- Create: `.gitignore` (root)

**Step 1: Initialize Bun project**

Run: `cd backend && bun init -y`

Expected: Creates `package.json`, `tsconfig.json`, `README.md`

**Step 2: Install core dependencies**

Run:
```bash
cd backend
bun add elysia @elysiaos/jwt
bun add -d drizzle-orm postgres drizzle-kit bcryptjs @types/bcryptjs
bun add -d bun-types
```

Expected: Packages installed, `node_modules` created

**Step 3: Create package.json with scripts**

Create: `backend/package.json`

```json
{
  "name": "todo-backend",
  "version": "0.1.0",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "bun test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "elysia": "^1.0.0",
    "@elysiajs/jwt": "^1.0.0",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "drizzle-kit": "^0.20.0",
    "bun-types": "latest"
  }
}
```

**Step 4: Create tsconfig.json**

Create: `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Create backend .gitignore**

Create: `backend/.gitignore`

```
node_modules/
dist/
.env
*.log
drizzle/
```

**Step 6: Create root .gitignore**

Create: `.gitignore`

```
.env
node_modules/
dist/
*.log
.DS_Store
```

**Step 7: Create .env.example**

Create: `backend/.env.example`

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=3000
```

**Step 8: Commit**

Run:
```bash
git add backend/package.json backend/tsconfig.json backend/.gitignore .gitignore backend/.env.example
git commit -m "feat: initialize Bun project with dependencies"
```

---

## Task 2: Database Schema and Configuration

**Files:**
- Create: `backend/src/config/database.ts`
- Create: `backend/src/config/env.ts`
- Create: `backend/src/db/schema/users.ts`
- Create: `backend/src/db/schema/todos.ts`
- Create: `backend/src/db/schema/index.ts`
- Create: `backend/drizzle.config.ts`

**Step 1: Create environment validation with zod**

Create: `backend/src/config/env.ts`

```typescript
import { config } from 'dotenv';

config();

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
} as const;
```

**Step 2: Create database connection**

Create: `backend/src/config/database.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { env } from './env';

const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
```

**Step 3: Create users schema**

Create: `backend/src/db/schema/users.ts`

```typescript
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
```

**Step 4: Create todos schema**

Create: `backend/src/db/schema/todos.ts`

```typescript
import { pgTable, uuid, integer, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  priority: priorityEnum('priority').default('medium').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TodoInsert = typeof todos.$inferInsert;
export type TodoSelect = typeof todos.$inferSelect;
```

**Step 5: Export all schemas**

Create: `backend/src/db/schema/index.ts`

```typescript
export * from './users';
export * from './todos';
```

**Step 6: Create drizzle config**

Create: `backend/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

**Step 7: Generate and run migrations**

Run:
```bash
cd backend
bun run db:generate
bun run db:migrate
```

Expected: Migration files created in `drizzle/` directory, tables created in database

**Step 8: Commit**

Run:
```bash
git add backend/src/config backend/src/db backend/drizzle.config.ts backend/package.json
git commit -m "feat: add database schema with Drizzle ORM"
```

---

## Task 3: Basic Server Setup

**Files:**
- Create: `backend/src/index.ts`

**Step 1: Create basic Elysia server**

Create: `backend/src/index.ts`

```typescript
import { Elysia } from 'elysia';
import { env } from './config/env';

const app = new Elysia()
  .get('/', () => ({ message: 'Todo API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(env.PORT);

console.log(`🦊 Server running at http://localhost:${env.PORT}`);
```

**Step 2: Test server starts**

Run: `cd backend && bun run dev`

Expected: Server starts on port 3000

**Step 3: Test health endpoint**

Run: `curl http://localhost:3000/health`

Expected: `{"status":"ok","timestamp":"..."}`

**Step 4: Stop server**

Press: `Ctrl+C`

**Step 5: Commit**

Run:
```bash
git add backend/src/index.ts
git commit -m "feat: add basic server with health check"
```

---

## Task 4: TypeBox Validation Schemas

**Files:**
- Create: `backend/src/types/schemas.ts`

**Step 1: Create validation schemas**

Create: `backend/src/types/schemas.ts`

```typescript
import { t } from 'elysia';

// Auth schemas
export const registerSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

export const loginSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

export const authResponseSchema = t.Object({
  user: t.Object({
    id: t.Number(),
    email: t.String(),
  }),
  token: t.String(),
});

// Todo schemas
export const createTodoSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  dueDate: t.Optional(t.String({ format: 'date-time' })),
  priority: t.Optional(t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])),
});

export const updateTodoSchema = t.Partial(createTodoSchema);

export const todoSchema = t.Object({
  id: t.String(),
  userId: t.Number(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  dueDate: t.Union([t.String(), t.Null()]),
  priority: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')]),
  completed: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const todosResponseSchema = t.Object({
  todos: t.Array(todoSchema),
  total: t.Number(),
});

export const errorResponseSchema = t.Object({
  success: t.Literal(false),
  error: t.String(),
});
```

**Step 2: Commit**

Run:
```bash
git add backend/src/types/schemas.ts
git commit -m "feat: add TypeBox validation schemas"
```

---

## Task 5: Authentication Plugin with JWT

**Files:**
- Create: `backend/src/plugins/auth.ts`

**Step 1: Create auth plugin**

Create: `backend/src/plugins/auth.ts`

```typescript
import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema';
import { env } from '../config/env';
import {
  registerSchema,
  loginSchema,
  authResponseSchema,
  errorResponseSchema,
} from '../types/schemas';

export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    })
  )
  .post(
    '/api/auth/register',
    async ({ body, jwt }) => {
      const { email, password } = body;

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning();

      const token = await jwt.sign({
        userId: newUser.id,
        email: newUser.email,
      });

      return {
        user: { id: newUser.id, email: newUser.email },
        token,
      };
    },
    {
      body: registerSchema,
      response: {
        200: authResponseSchema,
        409: errorResponseSchema,
      },
    }
  )
  .post(
    '/api/auth/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
      });

      return {
        user: { id: user.id, email: user.email },
        token,
      };
    },
    {
      body: loginSchema,
      response: {
        200: authResponseSchema,
        401: errorResponseSchema,
      },
    }
  );
```

**Step 2: Add auth plugin to main server**

Modify: `backend/src/index.ts`

```typescript
import { Elysia } from 'elysia';
import { env } from './config/env';
import { authPlugin } from './plugins/auth';

const app = new Elysia()
  .use(authPlugin)
  .get('/', () => ({ message: 'Todo API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(env.PORT);

console.log(`🦊 Server running at http://localhost:${env.PORT}`);
```

**Step 3: Commit**

Run:
```bash
git add backend/src/plugins/auth.ts backend/src/index.ts
git commit -m "feat: add authentication endpoints with JWT"
```

---

## Task 6: Auth Middleware for Protected Routes

**Files:**
- Create: `backend/src/middleware/auth.ts`

**Step 1: Create auth middleware**

Create: `backend/src/middleware/auth.ts`

```typescript
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../config/env';

export interface AuthContext {
  userId: number;
  email: string;
}

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    })
  )
  .derive(async ({ jwt, headers, set }) => {
    const auth = headers.authorization;

    if (!auth) {
      set.status = 401;
      throw new Error('Unauthorized: Missing Authorization header');
    }

    const token = auth.replace('Bearer ', '');
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid token');
    }

    return {
      userId: (payload as any).userId as number,
      email: (payload as any).email as string,
    } as AuthContext;
  });
```

**Step 2: Create /api/auth/me endpoint**

Modify: `backend/src/plugins/auth.ts`

Add after the login route:

```typescript
  .derive(() => ({ jwt, headers, set }))
  .onBeforeHandle(({ headers, set, jwt }) => ({
    async me() {
      const auth = headers.authorization;
      if (!auth) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      const payload = await jwt.verify(auth.replace('Bearer ', ''));
      if (!payload) {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      const [user] = await db.select().from(users).where(eq(users.id, (payload as any).userId));
      if (!user) {
        set.status = 404;
        return { success: false, error: 'User not found' };
      }

      return { id: user.id, email: user.email };
    }
  }))
  .get('/api/auth/me', async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const payload = await jwt.verify(auth.replace('Bearer ', ''));
    if (!payload) {
      set.status = 401;
      return { success: false, error: 'Invalid token' };
    }

    const [user] = await db.select().from(users).where(eq(users.id, (payload as any).userId));
    if (!user) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    return { id: user.id, email: user.email };
  })
```

**Step 3: Commit**

Run:
```bash
git add backend/src/middleware/auth.ts backend/src/plugins/auth.ts
git commit -m "feat: add auth middleware and /me endpoint"
```

---

## Task 7: Todos CRUD Plugin

**Files:**
- Create: `backend/src/plugins/todos.ts`

**Step 1: Create todos plugin**

Create: `backend/src/plugins/todos.ts`

```typescript
import { Elysia, t } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { todos } from '../db/schema';
import { authMiddleware, type AuthContext } from '../middleware/auth';
import {
  createTodoSchema,
  updateTodoSchema,
  todoSchema,
  todosResponseSchema,
} from '../types/schemas';

export const todosPlugin = new Elysia({ name: 'todos' })
  .use(authMiddleware)
  .get(
    '/api/todos',
    async ({ userId, query }) => {
      const conditions = [eq(todos.userId, userId)];

      if (query.completed !== undefined) {
        conditions.push(eq(todos.completed, query.completed === 'true'));
      }

      if (query.priority) {
        conditions.push(eq(todos.priority, query.priority));
      }

      const userTodos = await db
        .select()
        .from(todos)
        .where(and(...conditions))
        .orderBy(desc(todos.createdAt));

      return {
        todos: userTodos.map(todo => ({
          ...todo,
          id: todo.id.toString(),
          createdAt: todo.createdAt.toISOString(),
          updatedAt: todo.updatedAt.toISOString(),
          dueDate: todo.dueDate?.toISOString() || null,
        })),
        total: userTodos.length,
      };
    },
    {
      query: t.Object({
        completed: t.Optional(t.String()),
        priority: t.Optional(t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])),
      }),
      response: todosResponseSchema,
    }
  )
  .post(
    '/api/todos',
    async ({ userId, body }) => {
      const [newTodo] = await db
        .insert(todos)
        .values({
          ...body,
          userId,
        })
        .returning();

      return {
        ...newTodo,
        id: newTodo.id.toString(),
        createdAt: newTodo.createdAt.toISOString(),
        updatedAt: newTodo.updatedAt.toISOString(),
        dueDate: newTodo.dueDate?.toISOString() || null,
      };
    },
    {
      body: createTodoSchema,
      response: todoSchema,
    }
  )
  .get(
    '/api/todos/:id',
    async ({ userId, params, set }) => {
      const [todo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, userId)))
        .limit(1);

      if (!todo) {
        set.status = 404;
        return { success: false, error: 'Todo not found' };
      }

      return {
        ...todo,
        id: todo.id.toString(),
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        dueDate: todo.dueDate?.toISOString() || null,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: todoSchema,
        404: t.Object({ success: t.Literal(false), error: t.String() }),
      },
    }
  )
  .put(
    '/api/todos/:id',
    async ({ userId, params, body, set }) => {
      const [existingTodo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, userId)))
        .limit(1);

      if (!existingTodo) {
        set.status = 404;
        return { success: false, error: 'Todo not found' };
      }

      const [updatedTodo] = await db
        .update(todos)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(todos.id, params.id))
        .returning();

      return {
        ...updatedTodo,
        id: updatedTodo.id.toString(),
        createdAt: updatedTodo.createdAt.toISOString(),
        updatedAt: updatedTodo.updatedAt.toISOString(),
        dueDate: updatedTodo.dueDate?.toISOString() || null,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: updateTodoSchema,
      response: {
        200: todoSchema,
        404: t.Object({ success: t.Literal(false), error: t.String() }),
      },
    }
  )
  .delete(
    '/api/todos/:id',
    async ({ userId, params, set }) => {
      const [existingTodo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, userId)))
        .limit(1);

      if (!existingTodo) {
        set.status = 404;
        return { success: false, error: 'Todo not found' };
      }

      await db.delete(todos).where(eq(todos.id, params.id));

      return { success: true, message: 'Todo deleted' };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  .patch(
    '/api/todos/:id/complete',
    async ({ userId, params, set }) => {
      const [existingTodo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, userId)))
        .limit(1);

      if (!existingTodo) {
        set.status = 404;
        return { success: false, error: 'Todo not found' };
      }

      const [updatedTodo] = await db
        .update(todos)
        .set({ completed: true, updatedAt: new Date() })
        .where(eq(todos.id, params.id))
        .returning();

      return {
        ...updatedTodo,
        id: updatedTodo.id.toString(),
        createdAt: updatedTodo.createdAt.toISOString(),
        updatedAt: updatedTodo.updatedAt.toISOString(),
        dueDate: updatedTodo.dueDate?.toISOString() || null,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: todoSchema,
        404: t.Object({ success: t.Literal(false), error: t.String() }),
      },
    }
  );
```

**Step 2: Add todos plugin to main server**

Modify: `backend/src/index.ts`

```typescript
import { Elysia } from 'elysia';
import { env } from './config/env';
import { authPlugin } from './plugins/auth';
import { todosPlugin } from './plugins/todos';

const app = new Elysia()
  .use(authPlugin)
  .use(todosPlugin)
  .get('/', () => ({ message: 'Todo API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(env.PORT);

console.log(`🦊 Server running at http://localhost:${env.PORT}`);
```

**Step 3: Commit**

Run:
```bash
git add backend/src/plugins/todos.ts backend/src/index.ts
git commit -m "feat: add todos CRUD endpoints"
```

---

## Task 8: Tests for Authentication

**Files:**
- Create: `backend/test/auth.test.ts`

**Step 1: Write failing auth tests**

Create: `backend/test/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../src/config/database';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://localhost:3000';

describe('Authentication', () => {
  let testUserId: number;

  beforeAll(async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        passwordHash: '$2a$10$testhash',
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toBe('newuser@example.com');

      await db.delete(users).where(eq(users.email, 'newuser@example.com'));
    });

    it('should reject duplicate email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toHaveProperty('error');
    });

    it('should reject weak password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'weak@example.com',
          password: '123',
        }),
      });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await db
        .update(users)
        .set({ passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IKnWmDu2nJH5UKz5sPX/L3FJtQqY0W' })
        .where(eq(users.id, testUserId));

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd backend && bun test`

Expected: Tests should fail (server not running)

**Step 3: Commit**

Run:
```bash
git add backend/test/auth.test.ts
git commit -m "test: add auth endpoint tests"
```

---

## Task 9: Tests for Todos

**Files:**
- Create: `backend/test/todos.test.ts`

**Step 1: Write todo tests**

Create: `backend/test/todos.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../src/config/database';
import { users, todos } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://localhost:3000';

describe('Todos API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'todotest@example.com',
        password: 'password123',
      }),
    });

    const data = await registerResponse.json();
    authToken = data.token;
    userId = data.user.id;
  });

  afterAll(async () => {
    await db.delete(todos).where(eq(todos.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Todo',
          description: 'Test Description',
          priority: 'high',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Test Todo');
      expect(data.priority).toBe('high');
    });

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No Auth Todo' }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/todos', () => {
    let todoId: string;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: 'List Test Todo' }),
      });
      const data = await response.json();
      todoId = data.id;
    });

    it('should list user todos', async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.todos).toBeArray();
      expect(data.total).toBeGreaterThan(0);
    });

    it('should filter by completion status', async () => {
      const response = await fetch(`${BASE_URL}/api/todos?completed=false`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.todos.every((t: any) => !t.completed)).toBe(true);
    });
  });

  describe('PATCH /api/todos/:id/complete', () => {
    let todoId: string;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: 'Complete Test Todo' }),
      });
      const data = await response.json();
      todoId = data.id;
    });

    it('should mark todo as completed', async () => {
      const response = await fetch(`${BASE_URL}/api/todos/${todoId}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd backend && bun test`

Expected: Tests run

**Step 3: Commit**

Run:
```bash
git add backend/test/todos.test.ts
git commit -m "test: add todos endpoint tests"
```

---

## Task 10: Dockerfile for Backend

**Files:**
- Create: `backend/Dockerfile`

**Step 1: Create Dockerfile**

Create: `backend/Dockerfile`

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
ENV NODE_ENV production
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

**Step 2: Commit**

Run:
```bash
git add backend/Dockerfile
git commit -m "feat: add Dockerfile for backend"
```

---

## Task 11: Docker Compose for Local Development

**Files:**
- Create: `docker-compose.yml`

**Step 1: Create docker-compose.yml**

Create: `docker-compose.yml`

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U todo_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://todo_user:todo_pass@postgres:5432/todo_db
      JWT_SECRET: local_dev_secret_change_this
      NODE_ENV: development
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src

volumes:
  postgres_data:
```

**Step 2: Commit**

Run:
```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose for local development"
```

---

## Task 12: GitHub Actions CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [develop, master, release/**, hotfix/**]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: todo_db
          POSTGRES_USER: todo_user
          POSTGRES_PASSWORD: todo_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd backend
          bun install

      - name: Type check
        run: |
          cd backend
          bun run typecheck

      - name: Run tests
        run: |
          cd backend
          bun test
        env:
          DATABASE_URL: postgresql://todo_user:todo_pass@localhost:5432/todo_db
          JWT_SECRET: test_secret

      - name: Build Docker image
        run: |
          docker build -t todo-backend:test ./backend
```

**Step 2: Commit**

Run:
```bash
git add .github/workflows/ci.yml
git commit -m "feat: add CI workflow with tests"
```

---

## Task 13: GitHub Actions Deploy Staging

**Files:**
- Create: `.github/workflows/deploy-staging.yml`

**Step 1: Create staging deployment workflow**

Create: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        run: |
          docker build -t amiyokm/todo-backend:staging ./backend
          docker push amiyokm/todo-backend:staging

      - name: Deploy to staging
        run: |
          echo "Deploy to staging server here"
          # Add your deployment commands

      - name: Smoke tests
        run: |
          echo "Run smoke tests against staging"
          # Add your smoke test commands
```

**Step 2: Commit**

Run:
```bash
git add .github/workflows/deploy-staging.yml
git commit -m "feat: add staging deployment workflow"
```

---

## Task 14: GitHub Actions Deploy Production

**Files:**
- Create: `.github/workflows/deploy-production.yml`

**Step 1: Create production deployment workflow**

Create: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Create tag
        id: tag
        run: |
          TAG=v$(date +%Y.%m.%d-%H%M%S)
          echo "tag=$TAG" >> $GITHUB_OUTPUT
          git tag $TAG
          git push origin $TAG

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        run: |
          docker build -t amiyokm/todo-backend:production -t amiyokm/todo-backend:latest ./backend
          docker push amiyokm/todo-backend:production
          docker push amiyokm/todo-backend:latest

      - name: Deploy to production
        run: |
          echo "Deploy to production server here"
          # Add your deployment commands

      - name: Health check
        run: |
          echo "Run health checks against production"
          # Add your health check commands
```

**Step 2: Commit**

Run:
```bash
git add .github/workflows/deploy-production.yml
git commit -m "feat: add production deployment workflow"
```

---

## Task 15: Documentation

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create: `README.md`

```markdown
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
```

**Step 2: Commit**

Run:
```bash
git add README.md
git commit -m "docs: add README with API documentation"
```

---

## Task 16: Final Integration Test

**Step 1: Start local environment**

Run: `docker-compose up -d`

Expected: Services start successfully

**Step 2: Run migrations**

Run: `cd backend && bun run db:migrate`

Expected: Migrations apply successfully

**Step 3: Test complete flow**

Run: `bun run dev` (in separate terminal)

Then test:
```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Step 4: Stop services**

Run: `docker-compose down`

**Step 5: Final commit**

Run:
```bash
git add .
git commit -m "chore: final integration test and cleanup"
```

---

## Summary

This plan builds a complete production-ready todo API with:
- JWT authentication
- Todo CRUD with due dates and priority
- Type-safe database operations
- Input validation
- Comprehensive tests
- Docker support
- CI/CD pipeline with GitFlow

Total estimated tasks: 16
Files created: 20+
Total commits: 16+
