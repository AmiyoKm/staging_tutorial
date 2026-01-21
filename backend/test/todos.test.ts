import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/config/database";
import { todos, users } from "../src/db/schema";

const BASE_URL = "http://localhost:3000";

describe("Todos API", () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "todotest@example.com",
        password: "password123",
      }),
    });

    const data = (await registerResponse.json()) as { user: { id: number }; token: string };
    authToken = data.token;
    userId = data.user.id;
  });

  afterAll(async () => {
    await db.delete(todos).where(eq(todos.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  describe("POST /api/todos", () => {
    it("should create a new todo", async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Test Todo",
          description: "Test Description",
          priority: "high",
        }),
      });

      const data = (await response.json()) as { title: string; priority: string };

      expect(response.status).toBe(200);
      expect(data.title).toBe("Test Todo");
      expect(data.priority).toBe("high");
    });

    it("should require authentication", async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "No Auth Todo" }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/todos", () => {
    let todoId: string;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: "List Test Todo" }),
      });
      const data = (await response.json()) as { id: string };
      todoId = data.id;
    });

    it("should list user todos", async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = (await response.json()) as { todos: unknown[]; total: number };

      expect(response.status).toBe(200);
      expect(data.todos).toBeArray();
      expect(data.total).toBeGreaterThan(0);
    });

    it("should filter by completion status", async () => {
      const response = await fetch(`${BASE_URL}/api/todos?completed=false`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = (await response.json()) as { todos: { completed: boolean }[] };

      expect(response.status).toBe(200);
      expect(data.todos.every((t) => !t.completed)).toBe(true);
    });
  });

  describe("PATCH /api/todos/:id/complete", () => {
    let todoId: string;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: "Complete Test Todo" }),
      });
      const data = (await response.json()) as { id: string };
      todoId = data.id;
    });

    it("should mark todo as completed", async () => {
      const response = await fetch(`${BASE_URL}/api/todos/${todoId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = (await response.json()) as { completed: boolean };

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
    });
  });
});
