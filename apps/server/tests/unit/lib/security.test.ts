import { describe, it, expect, beforeEach, vi } from "vitest";
import path from "path";

/**
 * Note: security.ts maintains module-level state (allowed paths Set).
 * We need to reset modules and reimport for each test to get fresh state.
 */
describe("security.ts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("initAllowedPaths", () => {
    it("should parse comma-separated directories from environment", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/path1,/path2,/path3";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const allowed = getAllowedPaths();
      expect(allowed).toContain(path.resolve("/path1"));
      expect(allowed).toContain(path.resolve("/path2"));
      expect(allowed).toContain(path.resolve("/path3"));
    });

    it("should trim whitespace from paths", async () => {
      process.env.ALLOWED_PROJECT_DIRS = " /path1 , /path2 , /path3 ";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const allowed = getAllowedPaths();
      expect(allowed).toContain(path.resolve("/path1"));
      expect(allowed).toContain(path.resolve("/path2"));
    });

    it("should always include DATA_DIR if set", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "";
      process.env.DATA_DIR = "/data/dir";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const allowed = getAllowedPaths();
      expect(allowed).toContain(path.resolve("/data/dir"));
    });

    it("should handle empty ALLOWED_PROJECT_DIRS", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "";
      process.env.DATA_DIR = "/data";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const allowed = getAllowedPaths();
      expect(allowed).toHaveLength(1);
      expect(allowed[0]).toBe(path.resolve("/data"));
    });

    it("should skip empty entries in comma list", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/path1,,/path2,  ,/path3";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const allowed = getAllowedPaths();
      expect(allowed).toHaveLength(3);
    });
  });

  describe("addAllowedPath", () => {
    it("should add path to allowed list", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, addAllowedPath, getAllowedPaths } =
        await import("@/lib/security.js");
      initAllowedPaths();

      addAllowedPath("/new/path");

      const allowed = getAllowedPaths();
      expect(allowed).toContain(path.resolve("/new/path"));
    });

    it("should resolve relative paths before adding", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, addAllowedPath, getAllowedPaths } =
        await import("@/lib/security.js");
      initAllowedPaths();

      addAllowedPath("./relative/path");

      const allowed = getAllowedPaths();
      const cwd = process.cwd();
      expect(allowed).toContain(path.resolve(cwd, "./relative/path"));
    });
  });

  describe("isPathAllowed", () => {
    it("should allow paths under allowed directories", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed/project";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("/allowed/project/file.txt")).toBe(true);
      expect(isPathAllowed("/allowed/project/subdir/file.txt")).toBe(true);
      expect(isPathAllowed("/allowed/project/deep/nested/file.txt")).toBe(true);
    });

    it("should allow the exact allowed directory", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed/project";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("/allowed/project")).toBe(true);
    });

    it("should reject paths outside allowed directories", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed/project";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("/not/allowed/file.txt")).toBe(false);
      expect(isPathAllowed("/tmp/file.txt")).toBe(false);
      expect(isPathAllowed("/etc/passwd")).toBe(false);
    });

    it("should block path traversal attempts", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed/project";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      // These should resolve outside the allowed directory
      expect(isPathAllowed("/allowed/project/../../../etc/passwd")).toBe(false);
      expect(isPathAllowed("/allowed/project/../../other/file.txt")).toBe(false);
    });

    it("should resolve relative paths correctly", async () => {
      const cwd = process.cwd();
      process.env.ALLOWED_PROJECT_DIRS = cwd;
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("./file.txt")).toBe(true);
      expect(isPathAllowed("./subdir/file.txt")).toBe(true);
    });

    it("should reject paths that are parents of allowed directories", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed/project/subdir";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("/allowed/project")).toBe(false);
      expect(isPathAllowed("/allowed")).toBe(false);
    });

    it("should handle multiple allowed directories", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/path1,/path2,/path3";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, isPathAllowed } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(isPathAllowed("/path1/file.txt")).toBe(true);
      expect(isPathAllowed("/path2/file.txt")).toBe(true);
      expect(isPathAllowed("/path3/file.txt")).toBe(true);
      expect(isPathAllowed("/path4/file.txt")).toBe(false);
    });
  });

  describe("validatePath", () => {
    it("should return resolved path for allowed paths", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, validatePath } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const result = validatePath("/allowed/file.txt");
      expect(result).toBe(path.resolve("/allowed/file.txt"));
    });

    it("should throw error for disallowed paths", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, validatePath } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(() => validatePath("/disallowed/file.txt")).toThrow("Access denied");
      expect(() => validatePath("/disallowed/file.txt")).toThrow(
        "not in an allowed directory"
      );
    });

    it("should include the file path in error message", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/allowed";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, validatePath } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      expect(() => validatePath("/bad/path.txt")).toThrow("/bad/path.txt");
    });

    it("should resolve paths before validation", async () => {
      const cwd = process.cwd();
      process.env.ALLOWED_PROJECT_DIRS = cwd;
      process.env.DATA_DIR = "";

      const { initAllowedPaths, validatePath } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const result = validatePath("./file.txt");
      expect(result).toBe(path.resolve(cwd, "./file.txt"));
    });
  });

  describe("getAllowedPaths", () => {
    it("should return array of allowed paths", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/path1,/path2";
      process.env.DATA_DIR = "/data";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const result = getAllowedPaths();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return resolved paths", async () => {
      process.env.ALLOWED_PROJECT_DIRS = "/test";
      process.env.DATA_DIR = "";

      const { initAllowedPaths, getAllowedPaths } = await import(
        "@/lib/security.js"
      );
      initAllowedPaths();

      const result = getAllowedPaths();
      expect(result[0]).toBe(path.resolve("/test"));
    });
  });
});
