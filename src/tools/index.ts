import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerVmTools } from "./vms.js";
import { registerPodTools } from "./pods.js";
import { registerServerlessTools } from "./serverless.js";
import { registerRegistryTools } from "./registry.js";
import { registerVolumeTools } from "./volumes.js";

export function registerTools(server: McpServer): void {
  registerVmTools(server);
  registerPodTools(server);
  registerServerlessTools(server);
  registerRegistryTools(server);
  registerVolumeTools(server);
}
