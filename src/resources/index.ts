import { createRequire } from "node:module";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GpuType } from "../api/types.js";

const require = createRequire(import.meta.url);
const gpus: GpuType[] = require("./gpus.json");

export function getGpuByType(gpuType: string): GpuType | undefined {
  return gpus.find((g) => g.gpuType === gpuType);
}

export function registerResources(server: McpServer): void {
  server.registerResource(
    "gpu-catalog",
    "yotta://gpus",
    { mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(gpus, null, 2),
        },
      ],
    })
  );

  server.registerResource(
    "gpu-type",
    new ResourceTemplate("yotta://gpus/{gpuType}", {
      list: async () => ({
        resources: gpus.map((g) => ({
          uri: `yotta://gpus/${g.gpuType}`,
          name: g.displayName,
          mimeType: "application/json",
        })),
      }),
    }),
    { mimeType: "application/json" },
    async (uri, variables) => {
      const gpu = getGpuByType(variables.gpuType as string);
      if (!gpu) {
        throw new Error(`Unknown GPU type: ${variables.gpuType}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(gpu, null, 2),
          },
        ],
      };
    }
  );
}
