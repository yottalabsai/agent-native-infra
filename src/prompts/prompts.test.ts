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

  it("registers launch-pod prompt", async () => {
    const promptNames: string[] = [];
    const mockServer = {
      registerPrompt: vi.fn((...args: unknown[]) => {
        promptNames.push(args[0] as string);
      }),
    };

    const { registerLaunchPodPrompt } = await import("./launch-pod.js");
    registerLaunchPodPrompt(mockServer as any);

    expect(promptNames).toEqual(["launch-pod"]);
  });

  it("registers serve-model prompt", async () => {
    const promptNames: string[] = [];
    const mockServer = {
      registerPrompt: vi.fn((...args: unknown[]) => {
        promptNames.push(args[0] as string);
      }),
    };

    const { registerServeModelPrompt } = await import("./serve-model.js");
    registerServeModelPrompt(mockServer as any);

    expect(promptNames).toEqual(["serve-model"]);
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

    expect(promptNames).toHaveLength(3);
    expect(promptNames).toContain("gpu-selector");
    expect(promptNames).toContain("launch-pod");
    expect(promptNames).toContain("serve-model");
  });
});
