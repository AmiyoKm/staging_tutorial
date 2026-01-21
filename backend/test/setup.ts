import { db } from '../src/config/database';
import { todos, users } from '../src/db/schema';

export async function cleanupDatabase() {
  await db.delete(todos);
  await db.delete(users);
}
