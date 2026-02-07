import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

const envVarSchema = z.object({
  key: z.string(),
  value: z.string(),
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
      containerVolumeInGb: z.number().optional().describe("Container volume size in GB"),
      envVars: z.array(envVarSchema).optional().describe("Environment variables"),
      ports: z.array(z.number()).optional().describe("Ports to expose"),
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
      statusList: z.string().optional().describe("Filter by status (comma-separated, e.g. RUNNING,STOPPED)"),
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

  server.tool(
    "pod_stop",
    "Stop a running pod",
    { id: z.number().describe("Pod ID") },
    async ({ id }) => {
      await getClient().stopPod(id);
      return { content: [{ type: "text" as const, text: `Pod ${id} stopped.` }] };
    }
  );
}
