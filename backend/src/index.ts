import { Elysia } from "elysia";
import { env } from "./config/env";
import { authPlugin } from "./plugins/auth";
import { todosPlugin } from "./plugins/todos";

export const app = new Elysia()
  .use(authPlugin)
  .use(todosPlugin)
  .get("/", () => ({ message: "Todo API is running" }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`🦊 Server running at http://localhost:${env.PORT}`);
  });
}

export default app;
