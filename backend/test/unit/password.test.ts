import { describe, test, expect } from 'bun:test';
import bcrypt from 'bcryptjs';

describe('Password Utilities', () => {
  describe('bcrypt.hash', () => {
    test('hashes password with salt rounds', async () => {
      const password = 'securePassword123';
      const saltRounds = 10;

      const hash = await bcrypt.hash(password, saltRounds);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('produces different hashes for same password (due to salt)', async () => {
      const password = 'samePassword';
      const saltRounds = 10;

      const hash1 = await bcrypt.hash(password, saltRounds);
      const hash2 = await bcrypt.hash(password, saltRounds);

      expect(hash1).not.toBe(hash2);
    });

    test('includes bcrypt algorithm identifier', async () => {
      const password = 'testPassword';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('bcrypt.compare', () => {
    test('returns true for correct password', async () => {
      const password = 'correctPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });

    test('returns false for incorrect password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    test('is case sensitive', async () => {
      const password = 'MyPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('mypassword', hash);

      expect(isValid).toBe(false);
    });

    test('returns false for empty password when original was not empty', async () => {
      const password = 'notEmpty';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('common password weaknesses', () => {
    test('hashes short passwords', async () => {
      const shortPassword = 'abc';
      const hash = await bcrypt.hash(shortPassword, 10);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    test('hashes passwords with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const hash = await bcrypt.hash(specialPassword, 10);

      const isValid = await bcrypt.compare(specialPassword, hash);
      expect(isValid).toBe(true);
    });

    test('hashes passwords with unicode characters', async () => {
      const unicodePassword = 'пароль123';
      const hash = await bcrypt.hash(unicodePassword, 10);

      const isValid = await bcrypt.compare(unicodePassword, hash);
      expect(isValid).toBe(true);
    });

    test('hashes very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await bcrypt.hash(longPassword, 10);

      const isValid = await bcrypt.compare(longPassword, hash);
      expect(isValid).toBe(true);
    });
  });
});
