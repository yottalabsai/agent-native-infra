import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGpuSelectorPrompt } from "./gpu-selector.js";
import { registerLaunchPodPrompt } from "./launch-pod.js";
import { registerServeModelPrompt } from "./serve-model.js";

export function registerPrompts(server: McpServer): void {
  registerGpuSelectorPrompt(server);
  registerLaunchPodPrompt(server);
  registerServeModelPrompt(server);
}
