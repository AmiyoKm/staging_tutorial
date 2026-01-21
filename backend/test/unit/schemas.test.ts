import { describe, test, expect } from 'bun:test';
import { t } from 'elysia';
import { Value } from '@sinclair/typebox/value';

// Recreate schemas for testing (matching the actual schemas in the codebase)
const registerSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

const loginSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

const createTodoSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  dueDate: t.Optional(t.String({ format: 'date-time' })),
  priority: t.Optional(t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])),
});

const updateTodoSchema = t.Partial(createTodoSchema);

// Helper function to validate schemas using TypeBox's Value.Check
function validateSchema(schema: any, data: any) {
  return Value.Check(schema, data);
}

describe('Schema Validation', () => {
  describe('registerSchema', () => {
    test('accepts valid email and password', () => {
      const data = {
        email: 'user@example.com',
        password: 'securePass123',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(true);
    });

    test('rejects invalid email format', () => {
      const data = {
        email: 'not-an-email',
        password: 'securePass123',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(false);
    });

    test('rejects password shorter than 8 characters', () => {
      const data = {
        email: 'user@example.com',
        password: 'short',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(false);
    });

    test('rejects missing email', () => {
      const data = {
        password: 'securePass123',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(false);
    });

    test('rejects missing password', () => {
      const data = {
        email: 'user@example.com',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(false);
    });

    test('accepts passwords exactly 8 characters', () => {
      const data = {
        email: 'user@example.com',
        password: '12345678',
      };

      const isValid = validateSchema(registerSchema, data);
      expect(isValid).toBe(true);
    });
  });

  describe('loginSchema', () => {
    test('accepts valid email and password', () => {
      const data = {
        email: 'user@example.com',
        password: 'anypassword',
      };

      const isValid = validateSchema(loginSchema, data);
      expect(isValid).toBe(true);
    });

    test('rejects invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };

      const isValid = validateSchema(loginSchema, data);
      expect(isValid).toBe(false);
    });

    test('accepts any password length (no minimum)', () => {
      const data = {
        email: 'user@example.com',
        password: 'short',
      };

      const isValid = validateSchema(loginSchema, data);
      expect(isValid).toBe(true);
    });
  });

  describe('createTodoSchema', () => {
    test('accepts valid todo with all fields', () => {
      const data = {
        title: 'Test Todo',
        description: 'A description',
        dueDate: new Date().toISOString(),
        priority: 'high',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('accepts todo with only required title field', () => {
      const data = {
        title: 'Minimal Todo',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('rejects empty title', () => {
      const data = {
        title: '',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(false);
    });

    test('rejects title longer than 255 characters', () => {
      const data = {
        title: 'a'.repeat(256),
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(false);
    });

    test('accepts title exactly 255 characters', () => {
      const data = {
        title: 'a'.repeat(255),
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('rejects invalid date-time format for dueDate', () => {
      const data = {
        title: 'Test Todo',
        dueDate: 'not-a-date',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(false);
    });

    test('accepts valid low priority', () => {
      const data = {
        title: 'Test Todo',
        priority: 'low',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('accepts valid medium priority', () => {
      const data = {
        title: 'Test Todo',
        priority: 'medium',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('accepts valid high priority', () => {
      const data = {
        title: 'Test Todo',
        priority: 'high',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('rejects invalid priority value', () => {
      const data = {
        title: 'Test Todo',
        priority: 'urgent',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(false);
    });

    test('rejects missing title', () => {
      const data = {
        description: 'No title',
      };

      const isValid = validateSchema(createTodoSchema, data);
      expect(isValid).toBe(false);
    });
  });

  describe('updateTodoSchema', () => {
    test('allows partial updates with only title', () => {
      const data = {
        title: 'Updated Title',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('allows partial updates with only description', () => {
      const data = {
        description: 'Updated description',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('allows partial updates with only priority', () => {
      const data = {
        priority: 'low',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('allows partial updates with only dueDate', () => {
      const data = {
        dueDate: new Date().toISOString(),
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('allows updating all fields', () => {
      const data = {
        title: 'New Title',
        description: 'New description',
        dueDate: new Date().toISOString(),
        priority: 'medium',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('allows empty object (no updates)', () => {
      const data = {};

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(true);
    });

    test('still validates title when provided', () => {
      const data = {
        title: '',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(false);
    });

    test('still validates priority when provided', () => {
      const data = {
        priority: 'invalid',
      };

      const isValid = validateSchema(updateTodoSchema, data);
      expect(isValid).toBe(false);
    });
  });
});
