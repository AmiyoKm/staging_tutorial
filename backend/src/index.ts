import { Elysia } from 'elysia';
import { env } from './config/env';
import { authPlugin } from './plugins/auth';

const app = new Elysia()
  .use(authPlugin)
  .get('/', () => ({ message: 'Todo API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(env.PORT);

console.log(`🦊 Server running at http://localhost:${env.PORT}`);
