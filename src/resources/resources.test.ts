import { describe, it, expect, vi } from "vitest";
import gpuData from "./gpus.json";
import { getGpuByType } from "./index.js";

describe("GPU catalog", () => {
  it("gpus.json contains valid entries with all required fields", () => {
    expect(gpuData.length).toBeGreaterThan(0);
    for (const gpu of gpuData) {
      expect(gpu).toHaveProperty("gpuType");
      expect(gpu).toHaveProperty("displayName");
      expect(gpu).toHaveProperty("vramGb");
      expect(gpu).toHaveProperty("pricePerHour");
      expect(gpu).toHaveProperty("regions");
      expect(typeof gpu.gpuType).toBe("string");
      expect(typeof gpu.displayName).toBe("string");
      expect(typeof gpu.vramGb).toBe("number");
      expect(typeof gpu.pricePerHour).toBe("number");
      expect(Array.isArray(gpu.regions)).toBe(true);
    }
  });

  it("getGpuByType returns matching GPU", () => {
    const gpu = getGpuByType("RTX_4090_24G");
    expect(gpu).toBeDefined();
    expect(gpu!.displayName).toBe("NVIDIA RTX 4090");
    expect(gpu!.vramGb).toBe(24);
  });

  it("getGpuByType returns undefined for unknown type", () => {
    expect(getGpuByType("NONEXISTENT_GPU")).toBeUndefined();
  });
});

describe("resource registration", () => {
  it("registers gpu-catalog and gpu-type resources", async () => {
    const resourceNames: string[] = [];
    const mockServer = {
      registerResource: vi.fn((...args: unknown[]) => {
        resourceNames.push(args[0] as string);
      }),
    };

    const { registerResources } = await import("./index.js");
    registerResources(mockServer as any);

    expect(resourceNames).toEqual(["gpu-catalog", "gpu-type"]);
  });
});
