import { createRequire } from "node:module";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GpuType } from "../api/types.js";

const require = createRequire(import.meta.url);
const gpus: GpuType[] = require("../resources/gpus.json");

interface PodTemplate {
  id: string;
  image: string;
  description: string;
  bestFor: string;
  defaultPorts: number[];
}

const POD_TEMPLATES: PodTemplate[] = [
  {
    id: "pytorch",
    image: "yottalabsai/pytorch:2.9.0-py3.11-cuda12.8.1-cudnn-devel-ubuntu22.04",
    description: "PyTorch 2.9 with CUDA 12.8, cuDNN, Python 3.11",
    bestFor: "General-purpose deep learning: training, fine-tuning, research",
    defaultPorts: [8888],
  },
  {
    id: "unsloth",
    image: "yottalabsai/unsloth:0.6.9-py3.11-cuda12.1-cudnn-devel-ubuntu22.04",
    description: "Unsloth 0.6 for fast LLM fine-tuning with CUDA 12.1",
    bestFor: "Fast LoRA/QLoRA fine-tuning of LLMs (2-5x speedup over standard)",
    defaultPorts: [8888],
  },
  {
    id: "skyrl",
    image: "yottalabsai/skyrl:ray2.51-py3.11-cuda12.1-cudnn-devel-ubuntu22.04",
    description: "SkyRL on Ray 2.51 with CUDA 12.1, Python 3.11",
    bestFor: "Reinforcement learning from human feedback (RLHF), PPO, GRPO",
    defaultPorts: [8888, 8265],
  },
  {
    id: "comfyui",
    image: "yottalabsai/comfyui:cuda12.8.1-ubuntu22.04-2025102101",
    description: "ComfyUI node-based Stable Diffusion interface with CUDA 12.8",
    bestFor: "Image generation workflows, Stable Diffusion, SDXL, Flux",
    defaultPorts: [8188],
  },
];

function buildPromptText(args: {
  template: string;
  forDevelopment?: boolean;
  storage?: string;
}): string {
  const sections: string[] = [];

  sections.push(`# Pod Launch Assistant

You are a GPU cloud infrastructure advisor for Yotta Platform. Help the user configure and launch a GPU pod. A pod is an interactive GPU instance (like a VM with GPUs attached) suitable for development, training, or batch processing.`);

  // User requirements
  const reqs: string[] = [`- **Template:** ${args.template}`];
  if (args.forDevelopment !== undefined)
    reqs.push(`- **Development mode:** ${args.forDevelopment ? "yes (expose Jupyter & TensorBoard)" : "no"}`);
  if (args.storage) reqs.push(`- **Storage:** ${args.storage}`);
  sections.push(`## User Requirements\n${reqs.join("\n")}`);

  // Template details
  const templateTable = POD_TEMPLATES.map(
    (t) => `| ${t.id} | \`${t.image}\` | ${t.description} | ${t.bestFor} | ${t.defaultPorts.join(", ")} |`
  ).join("\n");
  sections.push(`## Pod Templates

| Template | Image | Description | Best For | Default Ports |
|----------|-------|-------------|----------|---------------|
${templateTable}`);

  // GPU catalog
  sections.push(`## Available GPUs on Yotta Platform\n\`\`\`json\n${JSON.stringify(gpus, null, 2)}\n\`\`\``);

  // Storage guidelines
  sections.push(`## Storage Guidelines

| Size | Volume (GB) | Use Case |
|------|-------------|----------|
| small | 20 | Small models, code-only development |
| medium | 100 | Medium models (7B-13B), datasets up to 50 GB |
| large | 500 | Large models (70B+), large datasets, checkpoints |`);

  // Resolve selected template
  const selected = POD_TEMPLATES.find((t) => t.id === args.template);
  const storageGb = args.storage === "large" ? 500 : args.storage === "medium" ? 100 : 20;
  const ports = selected ? [...selected.defaultPorts] : [8888];
  if (args.forDevelopment) {
    if (!ports.includes(8888)) ports.push(8888);
    if (!ports.includes(6006)) ports.push(6006);
  }

  sections.push(`## Instructions

1. **Image:** Use \`${selected?.image ?? "select from templates above"}\` for the ${args.template} template.
2. **GPU selection:** Based on the template's use case, recommend an appropriate GPU type and count from the catalog. GPU count must be a power of 2 (1, 2, 4, 8).
   - **pytorch / unsloth / skyrl:** Ask the user what model they plan to work with, then estimate VRAM to pick the right GPU.
   - **comfyui:** A single RTX 4090 (24 GB) or RTX 5090 (32 GB) is usually sufficient for SDXL/Flux image generation.
3. **Storage:** Set \`containerVolumeInGb\` to ${storageGb} based on the user's storage preference.
4. **Ports:** Expose ports ${JSON.stringify(ports)}.${args.forDevelopment ? " Development mode: includes Jupyter (8888) and TensorBoard (6006)." : ""}
5. **Environment variables:** Remind the user about common env vars:
   - \`HF_TOKEN\` — Hugging Face access token (for gated models)
   - \`WANDB_API_KEY\` — Weights & Biases experiment tracking
6. **Output the final \`pod_create\` call.** Example:

\`\`\`
pod_create:
  name: "my-${args.template}-pod"
  image: "${selected?.image ?? "..."}"
  gpuType: "H100_80G"
  gpuCount: 1
  containerVolumeInGb: ${storageGb}
  ports: ${JSON.stringify(ports)}
\`\`\``);

  return sections.join("\n\n");
}

export function registerLaunchPodPrompt(server: McpServer): void {
  server.registerPrompt(
    "launch-pod",
    {
      description:
        "Configure and launch a GPU pod from a preset template (PyTorch, Unsloth, SkyRL, ComfyUI)",
      argsSchema: {
        template: z
          .enum(["pytorch", "unsloth", "skyrl", "comfyui"])
          .describe("Image preset: pytorch, unsloth (LLM fine-tuning), skyrl (RL/RLHF), comfyui (image gen)"),
        forDevelopment: z
          .boolean()
          .optional()
          .describe("If true, expose Jupyter (8888) and TensorBoard (6006) ports"),
        storage: z
          .enum(["small", "medium", "large"])
          .optional()
          .describe("Storage size: small (20 GB), medium (100 GB), large (500 GB)"),
      },
    },
    async (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildPromptText(args),
          },
        },
      ],
    })
  );
}
