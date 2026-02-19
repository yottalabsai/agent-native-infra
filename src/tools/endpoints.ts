import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

const envVarSchema = z.object({ key: z.string(), value: z.string() });
const resourceSchema = z.object({
  region: z.string(),
  gpuType: z.string(),
  gpuCount: z.number(),
});
const exposeSchema = z.object({
  port: z.number(),
  protocol: z.string(),
  proxyPort: z.number().optional(),
});

export function registerEndpointTools(server: McpServer): void {
  server.tool(
    "endpoint_create",
    "Create a new elastic (serverless) endpoint on Yotta Platform",
    {
      name: z.string().describe("Endpoint name (max 20 chars, must start with letter)"),
      image: z.string().describe("Docker image"),
      imageRegistry: z.string().optional().describe("Docker registry URL"),
      resources: z.array(resourceSchema).describe("GPU resources per worker"),
      workers: z.number().describe("Number of workers"),
      containerVolumeInGb: z.number().describe("Container volume in GB (min 20)"),
      envVars: z.array(envVarSchema).optional().describe("Environment variables"),
      expose: exposeSchema.optional().describe("Port exposure config"),
      serviceMode: z.enum(["ALB", "QUEUE", "CUSTOM"]).describe("Service mode"),
    },
    async (args) => {
      const ep = await getClient().createEndpoint(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_get",
    "Get details of a specific endpoint by ID",
    { id: z.number().describe("Endpoint ID") },
    async ({ id }) => {
      const ep = await getClient().getEndpoint(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_list",
    "List all elastic endpoints",
    {
      statusList: z.string().optional().describe("Filter by status (comma-separated)"),
    },
    async ({ statusList }) => {
      const eps = await getClient().listEndpoints(statusList);
      return { content: [{ type: "text" as const, text: JSON.stringify(eps, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_update",
    "Update an endpoint (name, workers, env vars). Cannot change image.",
    {
      id: z.number().describe("Endpoint ID"),
      name: z.string().optional().describe("New name"),
      workers: z.number().optional().describe("New worker count"),
      envVars: z.array(envVarSchema).optional().describe("New environment variables"),
    },
    async ({ id, ...updates }) => {
      const ep = await getClient().updateEndpoint(id, updates);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_delete",
    "Delete an endpoint. This action is irreversible.",
    { id: z.number().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().deleteEndpoint(id);
      return { content: [{ type: "text" as const, text: `Endpoint ${id} deleted.` }] };
    }
  );

  server.tool(
    "endpoint_stop",
    "Stop a running endpoint",
    { id: z.number().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().stopEndpoint(id);
      return { content: [{ type: "text" as const, text: `Endpoint ${id} stopped.` }] };
    }
  );

  server.tool(
    "endpoint_start",
    "Start a stopped endpoint",
    { id: z.number().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().startEndpoint(id);
      return { content: [{ type: "text" as const, text: `Endpoint ${id} started.` }] };
    }
  );

  server.tool(
    "endpoint_scale",
    "Scale the number of workers for an endpoint",
    {
      id: z.number().describe("Endpoint ID"),
      count: z.number().describe("Target worker count"),
    },
    async ({ id, count }) => {
      await getClient().scaleEndpointWorkers(id, count);
      return { content: [{ type: "text" as const, text: `Endpoint ${id} scaled to ${count} workers.` }] };
    }
  );

  server.tool(
    "endpoint_list_workers",
    "List workers for an endpoint",
    {
      id: z.number().describe("Endpoint ID"),
      statusList: z.string().optional().describe("Filter by worker status (comma-separated)"),
    },
    async ({ id, statusList }) => {
      const workers = await getClient().listEndpointWorkers(id, statusList);
      return { content: [{ type: "text" as const, text: JSON.stringify(workers, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_list_tasks",
    "List tasks for a QUEUE-mode endpoint",
    {
      id: z.number().describe("Endpoint ID"),
      status: z.number().optional().describe("Filter: 0=PROCESSING, 1=DELIVERED, 2=SUCCESS, 3=FAILED"),
      pageNumber: z.number().optional().describe("Page number"),
      pageSize: z.number().optional().describe("Page size"),
    },
    async ({ id, ...params }) => {
      const tasks = await getClient().listEndpointTasks(id, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
    }
  );

  server.tool(
    "endpoint_task_count",
    "Get task status counts for a QUEUE-mode endpoint",
    { id: z.number().describe("Endpoint ID") },
    async ({ id }) => {
      const counts = await getClient().getEndpointTaskCount(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(counts, null, 2) }] };
    }
  );
}
