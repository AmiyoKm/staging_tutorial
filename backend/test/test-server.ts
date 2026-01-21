import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../src/config/env";
import { todos, users } from "../src/db/schema";

let server: ReturnType<typeof Bun.serve>;
let sql: ReturnType<typeof postgres>;
let migrationDb: ReturnType<typeof drizzle>;

export async function startTestServer() {
  sql = postgres(env.DATABASE_URL, { max: 1 });
  migrationDb = drizzle(sql);

  await migrate(migrationDb, { migrationsFolder: "./drizzle" });

  await migrationDb.delete(todos);
  await migrationDb.delete(users);

  const { app } = await import("../src/index");

  server = Bun.serve({
    fetch: app.fetch,
    port: 3001,
  });

  return { url: `http://localhost:${server.port}` };
}

export async function stopTestServer() {
  server?.stop();
  await sql?.end({ timeout: 1 });
}

export async function cleanupDatabase() {
  if (migrationDb) {
    await migrationDb.delete(todos);
    await migrationDb.delete(users);
  }
}
