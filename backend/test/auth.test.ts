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
