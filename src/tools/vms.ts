import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

export function registerVmTools(server: McpServer): void {
  server.tool(
    "vm_create",
    "Create a new GPU virtual machine on Yotta Platform",
    {
      vmTypeId: z.number().describe("VM type ID (get from vm_types tool)"),
      region: z.string().describe('Region code (e.g. "us-east-1")'),
      name: z.string().describe("VM display name"),
      isSpot: z.number().optional().describe("0=on-demand (default), 1=spot instance"),
      volumeMountPaths: z.record(z.string(), z.string()).optional().describe("Volume ID to mount path mapping"),
    },
    async ({ vmTypeId, region, name, isSpot, volumeMountPaths }) => {
      const vm = await getClient().createVm({ vmTypeId, region, name, isSpot, volumeMountPaths });
      return { content: [{ type: "text" as const, text: JSON.stringify(vm, null, 2) }] };
    }
  );

  server.tool(
    "vm_get",
    "Get details of a specific VM by ID",
    { id: z.number().describe("VM ID") },
    async ({ id }) => {
      const vm = await getClient().getVm(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(vm, null, 2) }] };
    }
  );

  server.tool(
    "vm_list",
    "List virtual machines (paginated)",
    {
      page: z.number().optional().default(1).describe("Page number"),
      size: z.number().optional().default(10).describe("Page size"),
      status: z.string().optional().describe("Filter by status (e.g. running, stopped)"),
    },
    async ({ page, size, status }) => {
      const data = await getClient().listVms({ page, size, status });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "vm_types",
    "List available VM/GPU types with region availability. Use vmTypeId from the results to create a VM.",
    {},
    async () => {
      const types = await getClient().getVmTypes();
      return { content: [{ type: "text" as const, text: JSON.stringify(types, null, 2) }] };
    }
  );

  server.tool(
    "vm_rename",
    "Rename a virtual machine",
    {
      id: z.number().describe("VM ID"),
      name: z.string().describe("New VM name"),
    },
    async ({ id, name }) => {
      const vm = await getClient().renameVm(id, name);
      return { content: [{ type: "text" as const, text: JSON.stringify(vm, null, 2) }] };
    }
  );

  server.tool(
    "vm_terminate",
    "Terminate (delete) a virtual machine. This action is irreversible.",
    { id: z.number().describe("VM ID to terminate") },
    async ({ id }) => {
      await getClient().terminateVm(id);
      return { content: [{ type: "text" as const, text: `VM ${id} terminated successfully.` }] };
    }
  );
}
