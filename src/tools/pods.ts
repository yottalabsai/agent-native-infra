import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

const envVarSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const exposePortSchema = z.object({
  port: z.number(),
  protocol: z.string().describe('Protocol (e.g. "http", "tcp")'),
});

export function registerPodTools(server: McpServer): void {
  server.tool(
    "pod_create",
    "Create a new GPU pod on Yotta Platform",
    {
      name: z.string().describe("Pod name (1-255 chars)"),
      image: z.string().describe('Docker image (e.g. "pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime")'),
      gpuType: z.string().describe('GPU type code (e.g. "RTX_4090_24G", "A100_80G")'),
      gpuCount: z.number().describe("Number of GPUs (must be power of 2)"),
      regions: z.array(z.string()).optional().describe('Acceptable region codes for scheduling (e.g. ["us-east-1"])'),
      containerVolumeInGb: z.number().optional().describe("Container volume size in GB"),
      persistentVolumeInGb: z.number().optional().describe("Persistent volume size in GB"),
      persistentMountPath: z.string().optional().describe("Persistent volume mount path"),
      shmInGb: z.number().optional().describe("Shared memory size in GB"),
      minSingleCardVramInGb: z.number().optional().describe("Minimum single GPU card VRAM in GB"),
      minSingleCardRamInGb: z.number().optional().describe("Minimum single GPU card RAM in GB"),
      minSingleCardVcpu: z.number().optional().describe("Minimum single GPU card vCPU count"),
      initializationCommand: z.string().optional().describe("Command to run on pod start"),
      environmentVars: z.array(envVarSchema).optional().describe("Environment variables"),
      expose: z.array(exposePortSchema).optional().describe('Ports to expose (e.g. [{port: 8080, protocol: "http"}])'),
      containerRegistryAuthId: z.number().optional().describe("Container registry credential ID (for private images)"),
    },
    async (args) => {
      const pod = await getClient().createPod(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(pod, null, 2) }] };
    }
  );

  server.tool(
    "pod_get",
    "Get details of a specific pod by ID",
    { id: z.number().describe("Pod ID") },
    async ({ id }) => {
      const pod = await getClient().getPod(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(pod, null, 2) }] };
    }
  );

  server.tool(
    "pod_list",
    "List all pods, optionally filtered by region or status",
    {
      regionList: z.string().optional().describe("Filter by regions (comma-separated)"),
      statusList: z.string().optional().describe("Filter by status (comma-separated, e.g. RUNNING,PAUSED)"),
    },
    async ({ regionList, statusList }) => {
      const pods = await getClient().listPods({ regionList, statusList });
      return { content: [{ type: "text" as const, text: JSON.stringify(pods, null, 2) }] };
    }
  );

  server.tool(
    "pod_delete",
    "Delete a pod. This action is irreversible.",
    { id: z.number().describe("Pod ID to delete") },
    async ({ id }) => {
      await getClient().deletePod(id);
      return { content: [{ type: "text" as const, text: `Pod ${id} deleted successfully.` }] };
    }
  );

  server.tool(
    "pod_pause",
    "Pause a running pod",
    { id: z.number().describe("Pod ID") },
    async ({ id }) => {
      await getClient().pausePod(id);
      return { content: [{ type: "text" as const, text: `Pod ${id} paused.` }] };
    }
  );

  server.tool(
    "pod_resume",
    "Resume a paused pod",
    { id: z.number().describe("Pod ID") },
    async ({ id }) => {
      await getClient().resumePod(id);
      return { content: [{ type: "text" as const, text: `Pod ${id} resumed.` }] };
    }
  );
}
