import { describe, expect, test } from "bun:test";
import type {
  TodoInsert,
  TodoSelect,
  UserInsert,
  UserSelect,
} from "../../src/db/schema";

describe("Database Schema Types", () => {
  describe("User types", () => {
    test("UserInsert requires email and passwordHash", () => {
      const userInsert: UserInsert = {
        email: "test@example.com",
        passwordHash: "hashed-password",
      };

      expect(userInsert.email).toBe("test@example.com");
      expect(userInsert.passwordHash).toBe("hashed-password");
    });

    test("UserSelect includes id and timestamps", () => {
      const userSelect: UserSelect = {
        id: 1,
        email: "test@example.com",
        passwordHash: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(userSelect.id).toBe(1);
      expect(typeof userSelect.createdAt).toBe("object");
      expect(typeof userSelect.updatedAt).toBe("object");
    });
  });

  describe("Todo types", () => {
    test("TodoInsert requires userId, title, and priority", () => {
      const todoInsert: TodoInsert = {
        userId: 1,
        title: "Test Todo",
        priority: "medium",
      };

      expect(todoInsert.userId).toBe(1);
      expect(todoInsert.title).toBe("Test Todo");
      expect(todoInsert.priority).toBe("medium");
    });

    test("TodoInsert accepts optional fields", () => {
      const todoInsert: TodoInsert = {
        userId: 1,
        title: "Complete Todo",
        description: "Full description",
        dueDate: new Date(),
        priority: "high",
        completed: true,
      };

      expect(todoInsert.description).toBe("Full description");
      expect(todoInsert.dueDate).toBeInstanceOf(Date);
      expect(todoInsert.priority).toBe("high");
      expect(todoInsert.completed).toBe(true);
    });

    test("TodoSelect includes all fields with id and timestamps", () => {
      const now = new Date();
      const todoSelect: TodoSelect = {
        id: "uuid-123",
        userId: 1,
        title: "Full Todo",
        description: "Description",
        dueDate: now,
        priority: "low",
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      expect(todoSelect.id).toBe("uuid-123");
      expect(todoSelect.userId).toBe(1);
      expect(todoSelect.title).toBe("Full Todo");
      expect(todoSelect.priority).toBe("low");
      expect(todoSelect.completed).toBe(false);
    });

    test("priority type is limited to valid values", () => {
      const priorities: Array<"low" | "medium" | "high"> = [
        "low",
        "medium",
        "high",
      ];

      priorities.forEach((priority) => {
        const todoInsert: TodoInsert = {
          userId: 1,
          title: `Todo with ${priority} priority`,
          priority,
        };

        expect(["low", "medium", "high"]).toContain(todoInsert.priority!);
      });
    });
  });

  describe("Type relationships", () => {
    test("Todo userId must match User id type", () => {
      const userSelect: UserSelect = {
        id: 123,
        email: "user@example.com",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const todoInsert: TodoInsert = {
        userId: userSelect.id,
        title: "User Todo",
        priority: "medium",
      };

      expect(todoInsert.userId).toBe(userSelect.id);
    });

    test("Todo timestamps are Date objects", () => {
      const todoSelect: TodoSelect = {
        id: "uuid",
        userId: 1,
        title: "Test",
        description: null,
        dueDate: null,
        priority: "medium",
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(todoSelect.createdAt).toBeInstanceOf(Date);
      expect(todoSelect.updatedAt).toBeInstanceOf(Date);
    });

    test("Todo dueDate can be null or Date", () => {
      const now = new Date();
      const todoWithoutDueDate: TodoSelect = {
        id: "uuid1",
        userId: 1,
        title: "No Due Date",
        description: null,
        dueDate: null,
        priority: "medium",
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      const todoWithDueDate: TodoSelect = {
        id: "uuid2",
        userId: 1,
        title: "With Due Date",
        description: null,
        dueDate: now,
        priority: "medium",
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      expect(todoWithoutDueDate.dueDate).toBeNull();
      expect(todoWithDueDate.dueDate).toBeInstanceOf(Date);
    });

    test("Todo description can be null or string", () => {
      const now = new Date();
      const todoWithoutDescription: TodoSelect = {
        id: "uuid1",
        userId: 1,
        title: "No Description",
        description: null,
        dueDate: null,
        priority: "medium",
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      const todoWithDescription: TodoSelect = {
        id: "uuid2",
        userId: 1,
        title: "With Description",
        description: "A description",
        dueDate: null,
        priority: "medium",
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      expect(todoWithoutDescription.description).toBeNull();
      expect(todoWithDescription.description).toBe("A description");
    });
  });
});
