import { describe, it, expect, vi } from "vitest";

// Mock the API client so tool registration doesn't need real config
vi.mock("../api/client.js", () => ({
  getClient: () => ({}),
}));

describe("tool registration", () => {
  it("registers all expected VM tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerVmTools } = await import("./vms.js");
    registerVmTools(mockServer as any);

    expect(toolNames).toEqual([
      "vm_create",
      "vm_get",
      "vm_list",
      "vm_rename",
      "vm_terminate",
    ]);
  });

  it("registers all expected Pod tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerPodTools } = await import("./pods.js");
    registerPodTools(mockServer as any);

    expect(toolNames).toEqual([
      "pod_create",
      "pod_get",
      "pod_list",
      "pod_delete",
      "pod_pause",
      "pod_resume",
    ]);
  });

  it("registers all expected Endpoint tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerEndpointTools } = await import("./endpoints.js");
    registerEndpointTools(mockServer as any);

    expect(toolNames).toEqual([
      "endpoint_create",
      "endpoint_get",
      "endpoint_list",
      "endpoint_update",
      "endpoint_delete",
      "endpoint_stop",
      "endpoint_start",
      "endpoint_scale",
      "endpoint_list_workers",
      "endpoint_list_tasks",
      "endpoint_task_count",
    ]);
  });

  it("registers all expected Registry tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerRegistryTools } = await import("./registry.js");
    registerRegistryTools(mockServer as any);

    expect(toolNames).toEqual([
      "registry_list",
      "registry_get",
      "registry_create",
      "registry_update",
      "registry_delete",
    ]);
  });

  it("registerTools registers all 27 tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerTools } = await import("./index.js");
    registerTools(mockServer as any);

    expect(toolNames).toHaveLength(27);
    // Spot-check one from each category
    expect(toolNames).toContain("vm_create");
    expect(toolNames).toContain("pod_list");
    expect(toolNames).toContain("endpoint_scale");
    expect(toolNames).toContain("registry_delete");
  });
});
