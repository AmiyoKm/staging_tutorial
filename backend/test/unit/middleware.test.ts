import { describe, test, expect, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';

// The authMiddleware uses environment variables, set them before importing
const originalEnv = process.env;

describe('Auth Middleware', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-for-testing' };
  });

  test('middleware can be imported and is an Elysia instance', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth');

    expect(authMiddleware).toBeDefined();
    expect(authMiddleware).toBeInstanceOf(Elysia);
  });

  test('middleware has expected derive method', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth');

    // The middleware should define userId and email in the context
    const app = new Elysia()
      .use(authMiddleware)
      .get('/test', ({ userId, email }) => ({ userId, email }));

    expect(app).toBeDefined();
  });

  test('middleware throws error when Authorization header is missing', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth');

    const app = new Elysia()
      .use(authMiddleware)
      .get('/test', ({ userId }) => ({ userId }));

    const response = await app.handle(new Request('http://localhost/test'));

    // Should return 401 when auth is missing
    expect(response.status).toBe(401);
  });

  test('middleware throws error when token format is invalid', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth');

    const app = new Elysia()
      .use(authMiddleware)
      .get('/test', ({ userId }) => ({ userId }));

    const response = await app.handle(
      new Request('http://localhost/test', {
        headers: {
          Authorization: 'InvalidFormat token',
        },
      })
    );

    // Should return 401 for invalid token
    expect(response.status).toBe(401);
  });

  test('middleware rejects invalid JWT tokens', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth');

    const app = new Elysia()
      .use(authMiddleware)
      .get('/test', ({ userId }) => ({ userId }));

    const response = await app.handle(
      new Request('http://localhost/test', {
        headers: {
          Authorization: 'Bearer invalid-jwt-token',
        },
      })
    );

    // Should return 401 for invalid JWT
    expect(response.status).toBe(401);
  });
});
