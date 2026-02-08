import { pgTable, uuid, integer, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

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
