import { Elysia } from 'elysia';
import { env } from './config/env';

const app = new Elysia()
  .get('/', () => ({ message: 'Todo API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(env.PORT);

console.log(`🦊 Server running at http://localhost:${env.PORT}`);
