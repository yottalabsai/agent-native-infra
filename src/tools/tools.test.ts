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
      "vm_types",
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

  it("registers all expected Serverless tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerServerlessTools } = await import("./serverless.js");
    registerServerlessTools(mockServer as any);

    expect(toolNames).toEqual([
      "serverless_create",
      "serverless_get",
      "serverless_list",
      "serverless_update",
      "serverless_delete",
      "serverless_stop",
      "serverless_start",
      "serverless_scale",
      "serverless_list_workers",
      "serverless_list_tasks",
      "serverless_task_count",
      "serverless_submit_task",
      "serverless_get_task",
      "serverless_worker_logs",
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

  it("registerTools registers all 31 tools", async () => {
    const toolNames: string[] = [];
    const mockServer = { tool: vi.fn((...args: unknown[]) => { toolNames.push(args[0] as string); }) };

    const { registerTools } = await import("./index.js");
    registerTools(mockServer as any);

    expect(toolNames).toHaveLength(31);
    // Spot-check one from each category
    expect(toolNames).toContain("vm_create");
    expect(toolNames).toContain("vm_types");
    expect(toolNames).toContain("pod_list");
    expect(toolNames).toContain("serverless_scale");
    expect(toolNames).toContain("serverless_submit_task");
    expect(toolNames).toContain("serverless_worker_logs");
    expect(toolNames).toContain("registry_delete");
  });
});
