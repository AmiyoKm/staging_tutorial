import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/config/database";
import { users } from "../src/db/schema";
import { startTestServer, stopTestServer } from "./test-server";

describe("Authentication", () => {
  let baseUrl: string;
  let testUserId: number;

  beforeAll(async () => {
    baseUrl = (await startTestServer()).url;

    const [user] = await db
      .insert(users)
      .values({
        email: "test@example.com",
        passwordHash: "$2a$10$testhash",
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "password123",
        }),
      });

      const data = (await response.json()) as {
        user: { email: string };
        token: string;
      };

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("user");
      expect(data).toHaveProperty("token");
      expect(data.user.email).toBe("newuser@example.com");

      await db.delete(users).where(eq(users.email, "newuser@example.com"));
    });

    it("should reject duplicate email", async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(409);
      expect(data).toHaveProperty("error");
    });

    it("should reject weak password", async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "weak@example.com",
          password: "123",
        }),
      });

      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      await db
        .update(users)
        .set({
          passwordHash:
            "$2b$10$yLN/Tk8xZl8HwmLM7NI3a.U2QAHDcuCP9dW/m3XUppi6dCJ4ET7zC",
        })
        .where(eq(users.id, testUserId));

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const data = (await response.json()) as { token: string };

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("token");
    });

    it("should reject invalid credentials", async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
