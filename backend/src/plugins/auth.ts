import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema';
import { env } from '../config/env';
import {
  registerSchema,
  loginSchema,
  authResponseSchema,
  errorResponseSchema,
} from '../types/schemas';

export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    })
  )
  .post(
    '/api/auth/register',
    async ({ body, jwt }) => {
      const { email, password } = body;

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning();

      const token = await jwt.sign({
        userId: newUser.id,
        email: newUser.email,
      });

      return {
        user: { id: newUser.id, email: newUser.email },
        token,
      };
    },
    {
      body: registerSchema,
      response: {
        200: authResponseSchema,
        409: errorResponseSchema,
      },
    }
  )
  .post(
    '/api/auth/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
      });

      return {
        user: { id: user.id, email: user.email },
        token,
      };
    },
    {
      body: loginSchema,
      response: {
        200: authResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
  .get('/api/auth/me', async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const payload = await jwt.verify(auth.replace('Bearer ', ''));
    if (!payload) {
      set.status = 401;
      return { success: false, error: 'Invalid token' };
    }

    const [user] = await db.select().from(users).where(eq(users.id, (payload as any).userId));
    if (!user) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    return { id: user.id, email: user.email };
  });
