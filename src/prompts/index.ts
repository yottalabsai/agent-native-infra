import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGpuSelectorPrompt } from "./gpu-selector.js";

export function registerPrompts(server: McpServer): void {
  registerGpuSelectorPrompt(server);
}
