import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

const STORAGE_TYPES = ["S3", "CEPH", "VENDOR", "R2"] as const;

export function registerVolumeTools(server: McpServer): void {
  server.tool(
    "volume_create",
    "Create a new storage volume on Yotta Platform",
    {
      name: z.string().describe("Volume name"),
      storageType: z.enum(STORAGE_TYPES).describe("Storage type: S3 (unlimited), R2 (Cloudflare S3-compatible), CEPH (network storage), VENDOR (third-party)"),
      region: z.string().optional().describe("Region code — required for CEPH and VENDOR"),
      sizeInGb: z.number().optional().describe("Volume size in GB (1-10240) — required for CEPH and VENDOR"),
      vendorVolumeType: z.enum(["NVMe", "HDD"]).optional().describe("Vendor volume type — required for VENDOR storage"),
    },
    async (args) => {
      const volume = await getClient().createVolume(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(volume, null, 2) }] };
    }
  );

  server.tool(
    "volume_list",
    "List volumes, filtered by storage type",
    {
      storageType: z.enum(STORAGE_TYPES).describe("Storage type to list: S3, R2, CEPH, or VENDOR"),
      region: z.string().optional().describe("Filter by region code"),
      page: z.number().optional().describe("Page number (default: 1)"),
      size: z.number().optional().describe("Page size (default: 10)"),
    },
    async (args) => {
      const result = await getClient().listVolumes(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "volume_get",
    "Get details of a specific volume by ID",
    { id: z.number().describe("Volume ID") },
    async ({ id }) => {
      const volume = await getClient().getVolume(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(volume, null, 2) }] };
    }
  );

  server.tool(
    "volume_delete",
    "Delete a volume. Fails if the volume is currently mounted (mountCount > 0).",
    { id: z.number().describe("Volume ID") },
    async ({ id }) => {
      await getClient().deleteVolume(id);
      return { content: [{ type: "text" as const, text: `Volume ${id} deleted successfully.` }] };
    }
  );

  server.tool(
    "volume_rename",
    "Rename a volume",
    {
      id: z.number().describe("Volume ID"),
      name: z.string().describe("New volume name"),
    },
    async ({ id, name }) => {
      const volume = await getClient().renameVolume(id, name);
      return { content: [{ type: "text" as const, text: JSON.stringify(volume, null, 2) }] };
    }
  );

  server.tool(
    "volume_resize",
    "Resize a CEPH or VENDOR volume. Volume must be ACTIVE and not mounted.",
    {
      id: z.number().describe("Volume ID"),
      sizeInGb: z.number().describe("New size in GB (1-10240)"),
    },
    async ({ id, sizeInGb }) => {
      await getClient().resizeVolume(id, sizeInGb);
      return { content: [{ type: "text" as const, text: `Volume ${id} resize to ${sizeInGb} GB initiated.` }] };
    }
  );
}
