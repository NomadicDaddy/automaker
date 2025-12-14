import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProviderFactory } from "@/providers/provider-factory.js";
import { ClaudeProvider } from "@/providers/claude-provider.js";

describe("provider-factory.ts", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.warn.mockRestore();
  });

  describe("getProviderForModel", () => {
    describe("Claude models (claude-* prefix)", () => {
      it("should return ClaudeProvider for claude-opus-4-5-20251101", () => {
        const provider = ProviderFactory.getProviderForModel(
          "claude-opus-4-5-20251101"
        );
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should return ClaudeProvider for claude-sonnet-4-20250514", () => {
        const provider = ProviderFactory.getProviderForModel(
          "claude-sonnet-4-20250514"
        );
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should return ClaudeProvider for claude-haiku-4-5", () => {
        const provider = ProviderFactory.getProviderForModel("claude-haiku-4-5");
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should be case-insensitive for claude models", () => {
        const provider = ProviderFactory.getProviderForModel(
          "CLAUDE-OPUS-4-5-20251101"
        );
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });
    });

    describe("Claude aliases", () => {
      it("should return ClaudeProvider for 'haiku'", () => {
        const provider = ProviderFactory.getProviderForModel("haiku");
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should return ClaudeProvider for 'sonnet'", () => {
        const provider = ProviderFactory.getProviderForModel("sonnet");
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should return ClaudeProvider for 'opus'", () => {
        const provider = ProviderFactory.getProviderForModel("opus");
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should be case-insensitive for aliases", () => {
        const provider1 = ProviderFactory.getProviderForModel("HAIKU");
        const provider2 = ProviderFactory.getProviderForModel("Sonnet");
        const provider3 = ProviderFactory.getProviderForModel("Opus");

        expect(provider1).toBeInstanceOf(ClaudeProvider);
        expect(provider2).toBeInstanceOf(ClaudeProvider);
        expect(provider3).toBeInstanceOf(ClaudeProvider);
      });
    });

    describe("Unknown models", () => {
      it("should default to ClaudeProvider for unknown model", () => {
        const provider = ProviderFactory.getProviderForModel("unknown-model-123");
        expect(provider).toBeInstanceOf(ClaudeProvider);
      });

      it("should warn when defaulting to Claude", () => {
        ProviderFactory.getProviderForModel("random-model");
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining("Unknown model prefix")
        );
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining("random-model")
        );
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining("defaulting to Claude")
        );
      });

      it("should handle empty string", () => {
        const provider = ProviderFactory.getProviderForModel("");
        expect(provider).toBeInstanceOf(ClaudeProvider);
        expect(consoleSpy.warn).toHaveBeenCalled();
      });

      it("should default to ClaudeProvider for gpt models (not supported)", () => {
        const provider = ProviderFactory.getProviderForModel("gpt-5.2");
        expect(provider).toBeInstanceOf(ClaudeProvider);
        expect(consoleSpy.warn).toHaveBeenCalled();
      });

      it("should default to ClaudeProvider for o-series models (not supported)", () => {
        const provider = ProviderFactory.getProviderForModel("o1");
        expect(provider).toBeInstanceOf(ClaudeProvider);
        expect(consoleSpy.warn).toHaveBeenCalled();
      });
    });
  });

  describe("getAllProviders", () => {
    it("should return array of all providers", () => {
      const providers = ProviderFactory.getAllProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it("should include ClaudeProvider", () => {
      const providers = ProviderFactory.getAllProviders();
      const hasClaudeProvider = providers.some(
        (p) => p instanceof ClaudeProvider
      );
      expect(hasClaudeProvider).toBe(true);
    });

    it("should return exactly 1 provider", () => {
      const providers = ProviderFactory.getAllProviders();
      expect(providers).toHaveLength(1);
    });

    it("should create new instances each time", () => {
      const providers1 = ProviderFactory.getAllProviders();
      const providers2 = ProviderFactory.getAllProviders();

      expect(providers1[0]).not.toBe(providers2[0]);
    });
  });

  describe("checkAllProviders", () => {
    it("should return installation status for all providers", async () => {
      const statuses = await ProviderFactory.checkAllProviders();

      expect(statuses).toHaveProperty("claude");
    });

    it("should call detectInstallation on each provider", async () => {
      const statuses = await ProviderFactory.checkAllProviders();

      expect(statuses.claude).toHaveProperty("installed");
    });

    it("should return correct provider names as keys", async () => {
      const statuses = await ProviderFactory.checkAllProviders();
      const keys = Object.keys(statuses);

      expect(keys).toContain("claude");
      expect(keys).toHaveLength(1);
    });
  });

  describe("getProviderByName", () => {
    it("should return ClaudeProvider for 'claude'", () => {
      const provider = ProviderFactory.getProviderByName("claude");
      expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    it("should return ClaudeProvider for 'anthropic'", () => {
      const provider = ProviderFactory.getProviderByName("anthropic");
      expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    it("should be case-insensitive", () => {
      const provider1 = ProviderFactory.getProviderByName("CLAUDE");
      const provider2 = ProviderFactory.getProviderByName("ANTHROPIC");

      expect(provider1).toBeInstanceOf(ClaudeProvider);
      expect(provider2).toBeInstanceOf(ClaudeProvider);
    });

    it("should return null for unknown provider", () => {
      const provider = ProviderFactory.getProviderByName("unknown");
      expect(provider).toBeNull();
    });

    it("should return null for empty string", () => {
      const provider = ProviderFactory.getProviderByName("");
      expect(provider).toBeNull();
    });

    it("should create new instance each time", () => {
      const provider1 = ProviderFactory.getProviderByName("claude");
      const provider2 = ProviderFactory.getProviderByName("claude");

      expect(provider1).not.toBe(provider2);
      expect(provider1).toBeInstanceOf(ClaudeProvider);
      expect(provider2).toBeInstanceOf(ClaudeProvider);
    });
  });

  describe("getAllAvailableModels", () => {
    it("should return array of models", () => {
      const models = ProviderFactory.getAllAvailableModels();
      expect(Array.isArray(models)).toBe(true);
    });

    it("should include models from all providers", () => {
      const models = ProviderFactory.getAllAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it("should return models with required fields", () => {
      const models = ProviderFactory.getAllAvailableModels();

      models.forEach((model) => {
        expect(model).toHaveProperty("id");
        expect(model).toHaveProperty("name");
        expect(typeof model.id).toBe("string");
        expect(typeof model.name).toBe("string");
      });
    });

    it("should include Claude models", () => {
      const models = ProviderFactory.getAllAvailableModels();

      // Claude models should include claude-* in their IDs
      const hasClaudeModels = models.some((m) =>
        m.id.toLowerCase().includes("claude")
      );

      expect(hasClaudeModels).toBe(true);
    });
  });
});
