import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../api/client.js";

export function registerRegistryTools(server: McpServer): void {
  server.tool(
    "registry_list",
    "List all container registry credentials",
    {},
    async () => {
      const creds = await getClient().listRegistryCredentials();
      return { content: [{ type: "text" as const, text: JSON.stringify(creds, null, 2) }] };
    }
  );

  server.tool(
    "registry_get",
    "Get a container registry credential by ID",
    { id: z.number().describe("Credential ID") },
    async ({ id }) => {
      const cred = await getClient().getRegistryCredential(id);
      return { content: [{ type: "text" as const, text: JSON.stringify(cred, null, 2) }] };
    }
  );

  server.tool(
    "registry_create",
    "Create a container registry credential for pulling private images",
    {
      name: z.string().describe("Credential name"),
      type: z.enum(["DOCKER_HUB", "GCR", "ECR", "ACR", "PRIVATE"]).describe("Registry type"),
      username: z.string().describe("Registry username"),
      password: z.string().describe("Registry password or token"),
    },
    async (args) => {
      const cred = await getClient().createRegistryCredential(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(cred, null, 2) }] };
    }
  );

  server.tool(
    "registry_update",
    "Update a container registry credential",
    {
      id: z.number().describe("Credential ID"),
      name: z.string().optional().describe("New name"),
      username: z.string().optional().describe("New username"),
      password: z.string().optional().describe("New password/token"),
    },
    async ({ id, ...updates }) => {
      const cred = await getClient().updateRegistryCredential(id, updates);
      return { content: [{ type: "text" as const, text: JSON.stringify(cred, null, 2) }] };
    }
  );

  server.tool(
    "registry_delete",
    "Delete a container registry credential. Fails if in use by a Pod or Endpoint.",
    { id: z.number().describe("Credential ID") },
    async ({ id }) => {
      await getClient().deleteRegistryCredential(id);
      return { content: [{ type: "text" as const, text: `Registry credential ${id} deleted.` }] };
    }
  );
}
