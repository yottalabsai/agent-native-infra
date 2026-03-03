import { createRequire } from "node:module";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GpuType } from "../api/types.js";

const require = createRequire(import.meta.url);
const gpus: GpuType[] = require("../resources/gpus.json");

interface ServingFramework {
  id: string;
  image: string;
  description: string;
  bestFor: string;
  defaultPort: number;
  protocol: string;
  envVars: { key: string; description: string }[];
}

const SERVING_FRAMEWORKS: ServingFramework[] = [
  {
    id: "vllm",
    image: "vllm/vllm-openai:v0.7.3",
    description: "vLLM OpenAI-compatible server with PagedAttention for fast LLM inference",
    bestFor: "LLM inference, chat, text generation, code generation",
    defaultPort: 8000,
    protocol: "HTTP",
    envVars: [
      { key: "MODEL_NAME", description: "HuggingFace model ID" },
      { key: "HF_TOKEN", description: "HuggingFace access token (for gated models)" },
    ],
  },
  {
    id: "tgi",
    image: "ghcr.io/huggingface/text-generation-inference:3.1.1",
    description: "HuggingFace Text Generation Inference for production-grade LLM serving",
    bestFor: "LLM inference, chat, text generation (HuggingFace ecosystem)",
    defaultPort: 80,
    protocol: "HTTP",
    envVars: [
      { key: "MODEL_ID", description: "HuggingFace model ID" },
      { key: "HUGGING_FACE_HUB_TOKEN", description: "HuggingFace access token" },
    ],
  },
  {
    id: "triton",
    image: "nvcr.io/nvidia/tritonserver:25.01-py3",
    description: "NVIDIA Triton Inference Server for multi-framework, multi-model serving",
    bestFor: "Multi-model, non-LLM models, ensemble pipelines, image/video models",
    defaultPort: 8000,
    protocol: "HTTP",
    envVars: [],
  },
  {
    id: "custom",
    image: "nvidia/cuda:12.6.3-runtime-ubuntu22.04",
    description: "Base CUDA runtime — bring your own serving code",
    bestFor: "Custom models, proprietary serving logic, non-standard setups",
    defaultPort: 8080,
    protocol: "HTTP",
    envVars: [],
  },
];

function buildPromptText(args: {
  model: string;
  servingFramework?: string;
  serviceMode: string;
  quantization?: string;
}): string {
  const sections: string[] = [];

  sections.push(`# Model Serving Assistant

You are a GPU cloud infrastructure advisor for Yotta Platform. Help the user deploy a model as an inference service. Depending on the service mode, this will use either a pod (\`pod_create\`) or a serverless endpoint (\`serverless_create\`).`);

  // User requirements
  const reqs: string[] = [
    `- **Model:** ${args.model}`,
    `- **Service mode:** ${args.serviceMode}`,
  ];
  if (args.servingFramework) reqs.push(`- **Serving framework:** ${args.servingFramework}`);
  if (args.quantization) reqs.push(`- **Quantization:** ${args.quantization}`);
  sections.push(`## User Requirements\n${reqs.join("\n")}`);

  // Serving frameworks table
  const fwTable = SERVING_FRAMEWORKS.map(
    (f) =>
      `| ${f.id} | \`${f.image}\` | ${f.bestFor} | ${f.defaultPort} | ${f.protocol} |`
  ).join("\n");
  sections.push(`## Serving Frameworks

| Framework | Image | Best For | Port | Protocol |
|-----------|-------|----------|------|----------|
${fwTable}

**Selection guidance:**
- LLMs (text generation, chat, code): use **vLLM** for best throughput or **TGI** for HuggingFace ecosystem
- Multi-model or non-LLM (vision, audio, ensembles): use **Triton**
- Custom inference code: use **custom** base image`);

  // Service modes
  sections.push(`## Service Modes

| Mode | Deploy Via | Description |
|------|-----------|-------------|
| POD | \`pod_create\` | Interactive GPU instance. Good for development, testing, or single-user serving. |
| ALB | \`serverless_create\` | HTTP load balancer with round-robin routing. Real-time inference at scale. |
| QUEUE | \`serverless_create\` | Async job queue. Requests enqueued, results delivered via webhook. Ideal for batch/long jobs. |
| CUSTOM | \`serverless_create\` | Raw container, no built-in routing. You manage networking (gRPC, custom protocols). |`);

  // GPU catalog
  sections.push(`## Available GPUs on Yotta Platform\n\`\`\`json\n${JSON.stringify(gpus, null, 2)}\n\`\`\``);

  // VRAM estimation
  sections.push(`## VRAM Estimation for Inference

Base VRAM = model parameters × bytes per precision. Apply 1.1–1.2× overhead for KV cache and runtime.

| Precision | Bytes/param | 7B | 13B | 70B | 405B |
|-----------|-------------|------|------|------|-------|
| FP16/BF16 | 2 | 14 GB | 26 GB | 140 GB | 810 GB |
| INT8 | 1 | 7 GB | 13 GB | 70 GB | 405 GB |
| INT4/AWQ/GPTQ | 0.5 | 3.5 GB | 6.5 GB | 35 GB | 203 GB |`);

  // Resolve framework
  const fw = args.servingFramework
    ? SERVING_FRAMEWORKS.find((f) => f.id === args.servingFramework)
    : undefined;

  // Instructions diverge based on service mode
  const isPod = args.serviceMode === "POD";

  sections.push(`## Instructions

1. **Select serving framework:**${fw ? ` Use **${fw.id}** (\`${fw.image}\`).` : " Based on the model type, recommend vLLM for LLMs, Triton for non-LLM models, or custom for proprietary code."}
2. **Estimate VRAM:** Calculate VRAM for inference at ${args.quantization ?? "FP16"} precision using the table above. Apply 1.1–1.2× overhead.
3. **Choose GPU:** Select GPU type and count from the catalog. GPU count must be a power of 2.
4. **Configure deployment:**${isPod ? `
   - Use \`pod_create\` for a single interactive instance.
   - Expose the serving port (${fw?.defaultPort ?? "8000"}).
   - Set \`containerVolumeInGb\` large enough for model weights (50–100 GB for large models).` : `
   - Use \`serverless_create\` with \`serviceMode: "${args.serviceMode}"\`.
   - Set \`resources\` with region, GPU type, and count per worker.
   - Set \`workers\` count (start with 1, scale later with \`serverless_scale\`).
   - Set \`containerVolumeInGb\` >= 20 GB (recommend 50–100 GB for large models).
   - Configure \`expose\` with port ${fw?.defaultPort ?? 8000} and protocol ${fw?.protocol ?? "HTTP"}.
   - Endpoint name must be max 20 characters and start with a letter.`}
5. **Environment variables:**${fw && fw.envVars.length > 0 ? `\n${fw.envVars.map((e) => `   - \`${e.key}\` — ${e.description}`).join("\n")}` : " Set the model path/ID and any required access tokens."}${args.quantization ? `\n   - Include quantization flags if needed (e.g., \`--quantization ${args.quantization}\` for vLLM).` : ""}
6. **Output the final tool call.** Example:

${isPod ? `\`\`\`
pod_create:
  name: "serve-${args.model.split("/").pop()?.slice(0, 20) ?? "model"}"
  image: "${fw?.image ?? "vllm/vllm-openai:v0.7.3"}"
  gpuType: "H100_80G"
  gpuCount: 1
  containerVolumeInGb: 100
  ports: [${fw?.defaultPort ?? 8000}]
  envVars: [{"key": "MODEL_NAME", "value": "${args.model}"}]
\`\`\`` : `\`\`\`
serverless_create:
  name: "${args.model.split("/").pop()?.slice(0, 15) ?? "model"}-ep"
  image: "${fw?.image ?? "vllm/vllm-openai:v0.7.3"}"
  resources: [{"region": "us-east-1", "gpuType": "H100_80G", "gpuCount": 1}]
  workers: 1
  containerVolumeInGb: 100
  serviceMode: "${args.serviceMode}"
  expose: {"port": ${fw?.defaultPort ?? 8000}, "protocol": "${fw?.protocol ?? "HTTP"}"}
  envVars: [{"key": "MODEL_NAME", "value": "${args.model}"}]
\`\`\``}

${isPod ? "" : `7. **Remind the user** they can scale workers later with \`serverless_scale\` and monitor with \`serverless_list_workers\`${args.serviceMode === "QUEUE" ? " and \`serverless_list_tasks\`" : ""}.`}`);

  return sections.join("\n\n");
}

export function registerServeModelPrompt(server: McpServer): void {
  server.registerPrompt(
    "serve-model",
    {
      description:
        "Deploy a model for inference — as a pod (POD) or serverless endpoint (ALB, QUEUE, CUSTOM)",
      argsSchema: {
        model: z
          .string()
          .describe('Model to serve (e.g. "meta-llama/Llama-3-70B-Instruct", "stabilityai/stable-diffusion-xl-base-1.0")'),
        servingFramework: z
          .enum(["vllm", "tgi", "triton", "custom"])
          .optional()
          .describe("Serving framework: vllm (fast LLM), tgi (HuggingFace), triton (multi-model), custom"),
        serviceMode: z
          .enum(["POD", "ALB", "QUEUE", "CUSTOM"])
          .describe("Deployment mode: POD (interactive), ALB (HTTP load balancer), QUEUE (async jobs), CUSTOM (raw)"),
        quantization: z
          .enum(["fp16", "int8", "int4", "awq", "gptq"])
          .optional()
          .describe("Serving precision — lower precision reduces VRAM and improves throughput"),
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
