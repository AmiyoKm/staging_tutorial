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
