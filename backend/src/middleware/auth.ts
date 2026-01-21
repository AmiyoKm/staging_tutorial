import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../config/env';

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    })
  )
  .derive(
    { as: 'scoped' },
    async ({ jwt, headers, set }) => {
      const auth = headers.authorization;

      if (!auth) {
        set.status = 401;
        throw new Error('Unauthorized: Missing Authorization header');
      }

      const token = auth.replace('Bearer ', '');
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        throw new Error('Unauthorized: Invalid token');
      }

      return {
        userId: payload.userId as number,
        email: payload.email as string,
      };
    }
  );
