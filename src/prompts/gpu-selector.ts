import { createRequire } from "node:module";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GpuType } from "../api/types.js";

const require = createRequire(import.meta.url);
const gpus: GpuType[] = require("../resources/gpus.json");

function buildPromptText(args: {
  task: string;
  model?: string;
  budget?: string;
  quantization?: string;
  multiGpu?: boolean;
  spot?: boolean;
}): string {
  const sections: string[] = [];

  sections.push(`# GPU Selection Request

You are a GPU cloud infrastructure advisor for Yotta Platform. Help the user choose the best GPU(s) for their workload.`);

  // User requirements
  const reqs: string[] = [`- **Task:** ${args.task}`];
  if (args.model) reqs.push(`- **Model:** ${args.model}`);
  if (args.budget) reqs.push(`- **Budget:** ${args.budget}`);
  if (args.quantization) reqs.push(`- **Quantization:** ${args.quantization}`);
  if (args.multiGpu !== undefined) reqs.push(`- **Multi-GPU OK:** ${args.multiGpu ? "yes" : "no"}`);
  if (args.spot !== undefined) reqs.push(`- **Spot instances OK:** ${args.spot ? "yes" : "no"}`);
  sections.push(`## User Requirements\n${reqs.join("\n")}`);

  // GPU catalog
  sections.push(`## Available GPUs on Yotta Platform\n\`\`\`json\n${JSON.stringify(gpus, null, 2)}\n\`\`\``);

  // VRAM estimation rules
  sections.push(`## VRAM Estimation Heuristics

Use these rules to estimate VRAM requirements from model parameter count:

**Base VRAM per precision:**
| Precision | Bytes/param | 7B model | 13B model | 70B model | 405B model |
|-----------|-------------|----------|-----------|-----------|------------|
| FP32      | 4           | 28 GB    | 52 GB     | 280 GB    | 1620 GB    |
| FP16/BF16 | 2           | 14 GB    | 26 GB     | 140 GB    | 810 GB     |
| INT8      | 1           | 7 GB     | 13 GB     | 70 GB     | 405 GB     |
| INT4      | 0.5         | 3.5 GB   | 6.5 GB    | 35 GB     | 203 GB     |

**Task-specific overhead on top of base VRAM:**
- **Training (full):** 3-4x base VRAM (Adam optimizer states + gradients + activations)
- **Fine-tuning (LoRA/QLoRA):** 1.1-1.3x base VRAM (only adapter weights + small gradient buffer)
- **Inference:** 1.1-1.2x base VRAM (KV cache + runtime overhead; scales with batch size)`);

  // Selection instructions
  sections.push(`## Instructions

1. **Estimate VRAM:** Calculate the VRAM needed based on the model size, quantization (default FP16 if not specified), and task overhead.
2. **Filter GPUs:** From the catalog above, find GPUs where VRAM >= estimated requirement. ${args.multiGpu !== false ? "Consider multi-GPU configs (2x, 4x, 8x) if a single GPU is insufficient — GPU count must be a power of 2." : "Only recommend single-GPU configs."}
3. **Rank by fit:**${args.budget === "low" ? " Prioritize lowest cost options." : args.budget === "high" ? " Prioritize best performance regardless of cost." : " Balance cost and performance."}
4. **Spot eligibility:**${args.spot === false ? " Do not suggest spot instances." : ` Spot instances are ${args.task === "training" ? "risky for long training runs (preemption loses progress unless checkpointing is set up) — warn the user" : "generally safe for inference and short fine-tuning jobs"}.`}
5. **Recommend 1-3 options** with:
   - GPU type and count
   - Why it fits (VRAM headroom, compute tier)
   - Estimated cost tier
   - Any caveats (e.g., multi-GPU communication overhead, spot risk)
6. After your recommendation, show the user the exact \`pod_create\` or \`serverless_create\` tool parameters they would use to provision the recommended GPU.`);

  return sections.join("\n\n");
}

export function registerGpuSelectorPrompt(server: McpServer): void {
  server.registerPrompt(
    "gpu-selector",
    {
      description:
        "Recommend the best GPU(s) for your workload based on model, task type, VRAM needs, compute, budget, and scaling preferences",
      argsSchema: {
        task: z
          .enum(["training", "inference", "fine-tuning"])
          .describe("Workload type: training, inference, or fine-tuning"),
        model: z
          .string()
          .optional()
          .describe('Model name or parameter count (e.g. "Llama-3-70B", "7B", "SDXL")'),
        budget: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Cost sensitivity: low=cheapest, high=best performance"),
        quantization: z
          .enum(["fp32", "fp16", "int8", "int4"])
          .optional()
          .describe("Model precision — lower precision reduces VRAM needs"),
        multiGpu: z
          .boolean()
          .optional()
          .describe("Whether multi-GPU (tensor parallel) configurations are acceptable"),
        spot: z
          .boolean()
          .optional()
          .describe("Whether spot instances are acceptable (cheaper but can be preempted)"),
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
