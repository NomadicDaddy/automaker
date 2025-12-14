import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutoModeService } from "@/services/auto-mode-service.js";

describe("auto-mode-service.ts", () => {
  let service: AutoModeService;
  const mockEvents = {
    subscribe: vi.fn(),
    emit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AutoModeService(mockEvents as any);
  });

  describe("constructor", () => {
    it("should initialize with event emitter", () => {
      expect(service).toBeDefined();
    });
  });

  describe("startAutoLoop", () => {
    it("should throw if auto mode is already running", async () => {
      // Start first loop
      const promise1 = service.startAutoLoop("/test/project", 3);

      // Try to start second loop
      await expect(
        service.startAutoLoop("/test/project", 3)
      ).rejects.toThrow("already running");

      // Cleanup
      await service.stopAutoLoop();
      await promise1.catch(() => {});
    });

    it("should emit auto mode start event", async () => {
      const promise = service.startAutoLoop("/test/project", 3);

      // Give it time to emit the event
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockEvents.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: expect.stringContaining("Auto mode started"),
        })
      );

      // Cleanup
      await service.stopAutoLoop();
      await promise.catch(() => {});
    });
  });

  describe("stopAutoLoop", () => {
    it("should stop the auto loop", async () => {
      const promise = service.startAutoLoop("/test/project", 3);

      const runningCount = await service.stopAutoLoop();

      expect(runningCount).toBe(0);
      await promise.catch(() => {});
    });

    it("should return 0 when not running", async () => {
      const runningCount = await service.stopAutoLoop();
      expect(runningCount).toBe(0);
    });
  });
});
