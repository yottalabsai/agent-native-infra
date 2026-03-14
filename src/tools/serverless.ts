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
});

export function registerServerlessTools(server: McpServer): void {
  server.tool(
    "serverless_create",
    "Create a new elastic (serverless) endpoint on Yotta Platform",
    {
      name: z.string().describe("Endpoint name (max 20 chars, must start with letter)"),
      image: z.string().describe("Docker image"),
      imageRegistry: z.string().optional().describe("Docker registry URL"),
      resources: z.array(resourceSchema).describe("GPU resources per worker"),
      workers: z.number().describe("Number of workers"),
      containerVolumeInGb: z.number().describe("Container volume in GB (min 20)"),
      containerRegistryAuthId: z.number().optional().describe("Container registry credential ID (for private images)"),
      environmentVars: z.array(envVarSchema).optional().describe("Environment variables"),
      expose: exposeSchema.optional().describe("Port exposure config"),
      serviceMode: z.enum(["ALB", "QUEUE", "CUSTOM"]).describe("Service mode"),
      webhook: z.string().optional().describe("Webhook URL for worker status notifications (max 512 chars)"),
    },
    async (args) => {
      const ep = await getClient().createServerless(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "serverless_get",
    "Get details of a specific serverless endpoint by ID",
    { id: z.string().describe("Endpoint ID") },
    async ({ id }) => {
      const ep = await getClient().getServerless(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "serverless_list",
    "List all serverless endpoints",
    {
      statusList: z.string().optional().describe("Filter by status (comma-separated)"),
    },
    async ({ statusList }) => {
      const eps = await getClient().listServerless(statusList);
      return { content: [{ type: "text" as const, text: JSON.stringify(eps, null, 2) }] };
    }
  );

  server.tool(
    "serverless_update",
    "Update a serverless endpoint configuration",
    {
      id: z.string().describe("Endpoint ID"),
      name: z.string().describe("Endpoint name"),
      resources: z.array(resourceSchema).describe("GPU resources per worker"),
      workers: z.number().describe("Number of workers"),
      containerVolumeInGb: z.number().describe("Container volume in GB"),
      envVars: z.array(envVarSchema).optional().describe("Environment variables"),
      expose: exposeSchema.optional().describe("Port exposure config"),
      webhook: z.string().optional().describe("Webhook URL for worker status notifications"),
    },
    async ({ id, ...updates }) => {
      const ep = await getClient().updateServerless(id, updates);
      return { content: [{ type: "text" as const, text: JSON.stringify(ep, null, 2) }] };
    }
  );

  server.tool(
    "serverless_delete",
    "Delete a serverless endpoint. This action is irreversible.",
    { id: z.string().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().deleteServerless(id);
      return { content: [{ type: "text" as const, text: `Serverless endpoint ${id} deleted.` }] };
    }
  );

  server.tool(
    "serverless_stop",
    "Stop a running serverless endpoint",
    { id: z.string().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().stopServerless(id);
      return { content: [{ type: "text" as const, text: `Serverless endpoint ${id} stopped.` }] };
    }
  );

  server.tool(
    "serverless_start",
    "Start a stopped serverless endpoint",
    { id: z.string().describe("Endpoint ID") },
    async ({ id }) => {
      await getClient().startServerless(id);
      return { content: [{ type: "text" as const, text: `Serverless endpoint ${id} started.` }] };
    }
  );

  server.tool(
    "serverless_scale",
    "Scale the number of workers for a serverless endpoint",
    {
      id: z.string().describe("Endpoint ID"),
      count: z.number().describe("Target worker count"),
    },
    async ({ id, count }) => {
      await getClient().scaleServerlessWorkers(id, count);
      return { content: [{ type: "text" as const, text: `Serverless endpoint ${id} scaled to ${count} workers.` }] };
    }
  );

  server.tool(
    "serverless_list_workers",
    "List workers for a serverless endpoint",
    {
      id: z.string().describe("Endpoint ID"),
      statusList: z.string().optional().describe("Filter by worker status (comma-separated)"),
    },
    async ({ id, statusList }) => {
      const workers = await getClient().listServerlessWorkers(id, statusList);
      return { content: [{ type: "text" as const, text: JSON.stringify(workers, null, 2) }] };
    }
  );

  server.tool(
    "serverless_list_tasks",
    "List tasks for a QUEUE-mode serverless endpoint",
    {
      id: z.string().describe("Endpoint ID"),
      status: z.enum(["PROCESSING", "DELIVERED", "SUCCESS", "FAILED"]).optional().describe("Filter by task status"),
      pageNumber: z.number().optional().describe("Page number"),
      pageSize: z.number().optional().describe("Page size"),
    },
    async ({ id, ...params }) => {
      const tasks = await getClient().listServerlessTasks(id, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
    }
  );

  server.tool(
    "serverless_task_count",
    "Get task status counts for a QUEUE-mode serverless endpoint",
    { id: z.string().describe("Endpoint ID") },
    async ({ id }) => {
      const counts = await getClient().getServerlessTaskCount(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(counts, null, 2) }] };
    }
  );

  server.tool(
    "serverless_submit_task",
    "Submit a task to a QUEUE-mode serverless endpoint",
    {
      id: z.string().describe("Endpoint ID"),
      input: z.record(z.unknown()).describe("Task input data (any JSON)"),
      workerPort: z.number().describe("Worker port to forward the task to (1-65535)"),
      processUri: z.string().describe("Process URI on the worker (e.g. /v1/chat/completions)"),
      taskId: z.string().optional().describe("User-defined task ID (auto-generated if omitted)"),
      webhook: z.string().optional().describe("Webhook URL for async result delivery"),
      webhookAuthKey: z.string().optional().describe("Webhook authentication key"),
      headers: z.record(z.string()).optional().describe("Headers to forward with the task request"),
    },
    async ({ id, ...params }) => {
      const result = await getClient().submitServerlessTask(id, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "serverless_get_task",
    "Get details of a specific task by ID",
    {
      id: z.string().describe("Endpoint ID"),
      taskId: z.string().describe("Task ID"),
    },
    async ({ id, taskId }) => {
      const task = await getClient().getServerlessTask(id, taskId);
      return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
    }
  );

  server.tool(
    "serverless_worker_logs",
    "Get logs from a specific serverless worker",
    {
      id: z.string().describe("Endpoint ID"),
      workerId: z.string().describe("Worker ID"),
      pageSize: z.number().optional().describe("Number of log entries (default 100, max 1000)"),
      keyword: z.string().optional().describe("Filter logs by keyword"),
      startTime: z.string().optional().describe("Start time (epoch ms or ISO 8601)"),
      endTime: z.string().optional().describe("End time (epoch ms or ISO 8601)"),
      direction: z.enum(["Forward", "Backward"]).optional().describe("Log traversal direction"),
    },
    async ({ id, workerId, ...params }) => {
      const logs = await getClient().getServerlessWorkerLogs(id, workerId, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(logs, null, 2) }] };
    }
  );
}
