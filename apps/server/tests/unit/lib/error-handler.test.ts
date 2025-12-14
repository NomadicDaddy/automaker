import { describe, it, expect } from "vitest";
import {
  isAbortError,
  isAuthenticationError,
  classifyError,
  getUserFriendlyErrorMessage,
  type ErrorType,
} from "@/lib/error-handler.js";

describe("error-handler.ts", () => {
  describe("isAbortError", () => {
    it("should detect AbortError by error name", () => {
      const error = new Error("Operation cancelled");
      error.name = "AbortError";
      expect(isAbortError(error)).toBe(true);
    });

    it("should detect abort error by message content", () => {
      const error = new Error("Request was aborted");
      expect(isAbortError(error)).toBe(true);
    });

    it("should return false for non-abort errors", () => {
      const error = new Error("Something else went wrong");
      expect(isAbortError(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(isAbortError("not an error")).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });

  describe("isAuthenticationError", () => {
    it("should detect 'Authentication failed' message", () => {
      expect(isAuthenticationError("Authentication failed")).toBe(true);
    });

    it("should detect 'Invalid API key' message", () => {
      expect(isAuthenticationError("Invalid API key provided")).toBe(true);
    });

    it("should detect 'authentication_failed' message", () => {
      expect(isAuthenticationError("authentication_failed")).toBe(true);
    });

    it("should detect 'Fix external API key' message", () => {
      expect(isAuthenticationError("Fix external API key configuration")).toBe(true);
    });

    it("should return false for non-authentication errors", () => {
      expect(isAuthenticationError("Network connection error")).toBe(false);
      expect(isAuthenticationError("File not found")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(isAuthenticationError("authentication Failed")).toBe(false);
    });
  });

  describe("classifyError", () => {
    it("should classify authentication errors", () => {
      const error = new Error("Authentication failed");
      const result = classifyError(error);

      expect(result.type).toBe("authentication");
      expect(result.isAuth).toBe(true);
      expect(result.isAbort).toBe(false);
      expect(result.message).toBe("Authentication failed");
      expect(result.originalError).toBe(error);
    });

    it("should classify abort errors", () => {
      const error = new Error("Operation aborted");
      error.name = "AbortError";
      const result = classifyError(error);

      expect(result.type).toBe("abort");
      expect(result.isAbort).toBe(true);
      expect(result.isAuth).toBe(false);
      expect(result.message).toBe("Operation aborted");
    });

    it("should prioritize auth over abort if both match", () => {
      const error = new Error("Authentication failed and aborted");
      const result = classifyError(error);

      expect(result.type).toBe("authentication");
      expect(result.isAuth).toBe(true);
      expect(result.isAbort).toBe(true); // Still detected as abort too
    });

    it("should classify generic Error as execution error", () => {
      const error = new Error("Something went wrong");
      const result = classifyError(error);

      expect(result.type).toBe("execution");
      expect(result.isAuth).toBe(false);
      expect(result.isAbort).toBe(false);
    });

    it("should classify non-Error objects as unknown", () => {
      const error = "string error";
      const result = classifyError(error);

      expect(result.type).toBe("unknown");
      expect(result.message).toBe("string error");
    });

    it("should handle null and undefined", () => {
      const nullResult = classifyError(null);
      expect(nullResult.type).toBe("unknown");
      expect(nullResult.message).toBe("Unknown error");

      const undefinedResult = classifyError(undefined);
      expect(undefinedResult.type).toBe("unknown");
      expect(undefinedResult.message).toBe("Unknown error");
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("should return friendly message for abort errors", () => {
      const error = new Error("abort");
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("Operation was cancelled");
    });

    it("should return friendly message for authentication errors", () => {
      const error = new Error("Authentication failed");
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("Authentication failed. Please check your API key.");
    });

    it("should return original message for other errors", () => {
      const error = new Error("File not found");
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("File not found");
    });

    it("should handle non-Error objects", () => {
      const result = getUserFriendlyErrorMessage("Custom error");
      expect(result).toBe("Custom error");
    });
  });
});
