import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerVmTools } from "./vms.js";
import { registerPodTools } from "./pods.js";
import { registerEndpointTools } from "./endpoints.js";
import { registerRegistryTools } from "./registry.js";

export function registerTools(server: McpServer): void {
  registerVmTools(server);
  registerPodTools(server);
  registerEndpointTools(server);
  registerRegistryTools(server);
}
