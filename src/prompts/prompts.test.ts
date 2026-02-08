import { describe, it, expect, vi } from "vitest";

describe("prompt registration", () => {
  it("registers gpu-selector prompt", async () => {
    const promptNames: string[] = [];
    const mockServer = {
      registerPrompt: vi.fn((...args: unknown[]) => {
        promptNames.push(args[0] as string);
      }),
    };

    const { registerGpuSelectorPrompt } = await import("./gpu-selector.js");
    registerGpuSelectorPrompt(mockServer as any);

    expect(promptNames).toEqual(["gpu-selector"]);
  });

  it("registerPrompts registers all prompts", async () => {
    const promptNames: string[] = [];
    const mockServer = {
      registerPrompt: vi.fn((...args: unknown[]) => {
        promptNames.push(args[0] as string);
      }),
    };

    const { registerPrompts } = await import("./index.js");
    registerPrompts(mockServer as any);

    expect(promptNames).toHaveLength(1);
    expect(promptNames).toContain("gpu-selector");
  });
});
