import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildPromptWithImages } from "@/lib/prompt-builder.js";
import * as imageHandler from "@/lib/image-handler.js";

vi.mock("@/lib/image-handler.js");

describe("prompt-builder.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildPromptWithImages", () => {
    it("should return plain text when no images provided", async () => {
      const result = await buildPromptWithImages("Hello world");

      expect(result).toEqual({
        content: "Hello world",
        hasImages: false,
      });
    });

    it("should return plain text when imagePaths is empty array", async () => {
      const result = await buildPromptWithImages("Hello world", []);

      expect(result).toEqual({
        content: "Hello world",
        hasImages: false,
      });
    });

    it("should build content blocks with single image", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "base64data" },
        },
      ]);

      const result = await buildPromptWithImages("Describe this image", [
        "/test.png",
      ]);

      expect(result.hasImages).toBe(true);
      expect(Array.isArray(result.content)).toBe(true);
      const content = result.content as Array<any>;
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({ type: "text", text: "Describe this image" });
      expect(content[1].type).toBe("image");
    });

    it("should build content blocks with multiple images", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data1" },
        },
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: "data2" },
        },
      ]);

      const result = await buildPromptWithImages("Analyze these", [
        "/a.png",
        "/b.jpg",
      ]);

      expect(result.hasImages).toBe(true);
      const content = result.content as Array<any>;
      expect(content).toHaveLength(3); // 1 text + 2 images
      expect(content[0].type).toBe("text");
      expect(content[1].type).toBe("image");
      expect(content[2].type).toBe("image");
    });

    it("should include image paths in text when requested", async () => {
      vi.mocked(imageHandler.formatImagePathsForPrompt).mockReturnValue(
        "\n\nAttached images:\n- /test.png"
      );
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      const result = await buildPromptWithImages(
        "Base prompt",
        ["/test.png"],
        undefined,
        true
      );

      expect(imageHandler.formatImagePathsForPrompt).toHaveBeenCalledWith([
        "/test.png",
      ]);
      const content = result.content as Array<any>;
      expect(content[0].text).toContain("Base prompt");
      expect(content[0].text).toContain("Attached images:");
    });

    it("should not include image paths by default", async () => {
      vi.mocked(imageHandler.formatImagePathsForPrompt).mockReturnValue(
        "\n\nAttached images:\n- /test.png"
      );
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      const result = await buildPromptWithImages("Base prompt", ["/test.png"]);

      expect(imageHandler.formatImagePathsForPrompt).not.toHaveBeenCalled();
      const content = result.content as Array<any>;
      expect(content[0].text).toBe("Base prompt");
    });

    it("should pass workDir to convertImagesToContentBlocks", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      await buildPromptWithImages("Test", ["/test.png"], "/work/dir");

      expect(imageHandler.convertImagesToContentBlocks).toHaveBeenCalledWith(
        ["/test.png"],
        "/work/dir"
      );
    });

    it("should handle empty text content", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      const result = await buildPromptWithImages("", ["/test.png"]);

      expect(result.hasImages).toBe(true);
      // When text is empty/whitespace, should only have image blocks
      const content = result.content as Array<any>;
      expect(content.every((block) => block.type === "image")).toBe(true);
    });

    it("should trim text content before checking if empty", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      const result = await buildPromptWithImages("   ", ["/test.png"]);

      const content = result.content as Array<any>;
      // Whitespace-only text should be excluded
      expect(content.every((block) => block.type === "image")).toBe(true);
    });

    it("should return text when only one block and it's text", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([]);

      const result = await buildPromptWithImages("Just text", ["/missing.png"]);

      // If no images are successfully loaded, should return just the text
      expect(result.content).toBe("Just text");
      expect(result.hasImages).toBe(true); // Still true because images were requested
    });

    it("should handle workDir with relative paths", async () => {
      vi.mocked(imageHandler.convertImagesToContentBlocks).mockResolvedValue([
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: "data" },
        },
      ]);

      await buildPromptWithImages(
        "Test",
        ["relative.png"],
        "/absolute/work/dir"
      );

      expect(imageHandler.convertImagesToContentBlocks).toHaveBeenCalledWith(
        ["relative.png"],
        "/absolute/work/dir"
      );
    });
  });
});
