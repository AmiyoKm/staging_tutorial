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
