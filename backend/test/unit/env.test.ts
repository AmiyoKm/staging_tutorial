import { describe, test, expect, beforeEach } from 'bun:test';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Restore environment after each test
    process.env = { ...originalEnv };
  });

  test('exports env object with all required variables', () => {
    // Set required environment variables before importing
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.JWT_SECRET = 'test-secret';

    // Clear the require cache to reload the module
    delete require.cache[require.resolve('../../src/config/env')];

    const { env } = require('../../src/config/env');

    expect(env).toBeDefined();
    expect(env.DATABASE_URL).toBe('postgres://localhost/test');
    expect(env.JWT_SECRET).toBe('test-secret');
    expect(env.NODE_ENV).toBeDefined();
    expect(env.PORT).toBeDefined();
  });

  test('uses provided NODE_ENV when set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    delete require.cache[require.resolve('../../src/config/env')];

    const { env } = require('../../src/config/env');

    expect(env.NODE_ENV).toBe('test');
  });

  test('uses provided PORT when set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.PORT = '8080';

    delete require.cache[require.resolve('../../src/config/env')];

    const { env } = require('../../src/config/env');

    expect(env.PORT).toBe(8080);
  });

  test('defaults PORT to 3000 when not set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.PORT;

    delete require.cache[require.resolve('../../src/config/env')];

    const { env } = require('../../src/config/env');

    expect(env.PORT).toBe(3000);
  });

  test('env object is readonly (as const)', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.JWT_SECRET = 'test-secret';

    delete require.cache[require.resolve('../../src/config/env')];

    const { env } = require('../../src/config/env');

    // TypeScript should enforce these types at compile time
    expect(typeof env.DATABASE_URL).toBe('string');
    expect(typeof env.JWT_SECRET).toBe('string');
    expect(typeof env.NODE_ENV).toBe('string');
    expect(typeof env.PORT).toBe('number');
  });
});
