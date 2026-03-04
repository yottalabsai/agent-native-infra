# @yotta/agent-native-infra

MCP server and agent skills for [Yotta Platform](https://yotta.com) — the GPU cloud for AI/ML workloads.

Give any AI agent the ability to provision GPUs, launch pods, deploy models, and manage infrastructure through natural language. Built on the [Model Context Protocol](https://modelcontextprotocol.io) (MCP).

## What's included

| Layer | What it does | Count |
|-------|-------------|-------|
| **Tools** | CRUD operations for VMs, Pods, Serverless endpoints, Volumes, and Registry credentials | 37 |
| **Resources** | GPU catalog with specs, pricing, and availability | 2 |
| **Prompts** | Guided workflows for GPU selection, pod launch, and model serving | 3 |
| **Skills** | Agent skill definitions for Claude Code and compatible agents | 3 |

## Quick start

### Prerequisites

- Node.js >= 18
- A Yotta Platform API key ([get one here](https://yotta.com))

### Install and build

```bash
npm install
npm run build
```

### Run the server

```bash
YOTTA_API_KEY=your-api-key npx tsx src/index.ts
```

### Use with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "yotta": {
      "command": "npx",
      "args": ["tsx", "/path/to/agent-native-infra/src/index.ts"],
      "env": {
        "YOTTA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Use with Claude Code

```bash
claude mcp add yotta -- npx tsx /path/to/agent-native-infra/src/index.ts
```

Set the API key in your environment:

```bash
export YOTTA_API_KEY=your-api-key
```

### Test with MCP Inspector

```bash
YOTTA_API_KEY=your-api-key npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Tools

### Pods

Interactive GPU instances for development, training, and batch jobs.

| Tool | Description |
|------|-------------|
| `pod_create` | Create a GPU pod with a Docker image, GPU type/count, ports, and env vars |
| `pod_get` | Get pod details by ID |
| `pod_list` | List pods, optionally filtered by region or status |
| `pod_delete` | Delete a pod (irreversible) |
| `pod_pause` | Pause a running pod (stops billing, preserves state) |
| `pod_resume` | Resume a paused pod |

### Serverless

Elastic (serverless) GPU endpoints for production inference.

| Tool | Description |
|------|-------------|
| `serverless_create` | Create a serverless endpoint (ALB, QUEUE, or CUSTOM mode) |
| `serverless_get` | Get endpoint details by ID |
| `serverless_list` | List all serverless endpoints, optionally filtered by status |
| `serverless_update` | Update endpoint configuration |
| `serverless_delete` | Delete an endpoint (irreversible) |
| `serverless_stop` | Stop a running endpoint |
| `serverless_start` | Start a stopped endpoint |
| `serverless_scale` | Scale worker count up or down |
| `serverless_list_workers` | List workers for an endpoint |
| `serverless_list_tasks` | List tasks for a QUEUE-mode endpoint |
| `serverless_task_count` | Get task status counts |
| `serverless_submit_task` | Submit a task to a QUEUE-mode endpoint |
| `serverless_get_task` | Get details of a specific task by ID |
| `serverless_worker_logs` | Get logs from a specific worker |

### Virtual Machines

Full GPU virtual machines.

| Tool | Description |
|------|-------------|
| `vm_create` | Create a GPU VM (on-demand or spot) |
| `vm_get` | Get VM details by ID |
| `vm_list` | List VMs (paginated) |
| `vm_types` | List available VM/GPU types with region availability |
| `vm_rename` | Rename a VM |
| `vm_terminate` | Terminate a VM (irreversible) |

### Volumes

Persistent and object storage for pods and VMs.

| Tool | Description |
|------|-------------|
| `volume_create` | Create a storage volume (S3, R2, CEPH, VENDOR) |
| `volume_list` | List volumes by storage type (paginated) |
| `volume_get` | Get volume details by ID |
| `volume_delete` | Delete a volume (must be unmounted) |
| `volume_rename` | Rename a volume |
| `volume_resize` | Resize a CEPH or VENDOR volume |

### Container Registry

Manage credentials for pulling private Docker images.

| Tool | Description |
|------|-------------|
| `registry_list` | List all registry credentials |
| `registry_get` | Get a credential by ID |
| `registry_create` | Create a new credential |
| `registry_update` | Update a credential |
| `registry_delete` | Delete a credential |

## Resources

| URI | Description |
|-----|-------------|
| `yotta://gpus` | Full GPU catalog (all types with VRAM, pricing, regions) |
| `yotta://gpus/{gpuType}` | Individual GPU type details |

### Available GPUs

| GPU | VRAM |
|-----|------|
| NVIDIA RTX 4090 | 24 GB |
| NVIDIA RTX 5090 | 32 GB |
| NVIDIA A100 | 80 GB |
| NVIDIA H100 | 80 GB |
| NVIDIA H200 | 141 GB |
| NVIDIA B200 | 192 GB |
| NVIDIA B300 | 288 GB |
| NVIDIA RTX PRO 6000 | 96 GB |

## Prompts

### `gpu-selector`

Interactive GPU recommendation based on model size, task type, budget, and quantization. Estimates VRAM requirements and suggests optimal configurations.

```
Task: fine-tuning | Model: Llama-3-70B | Budget: medium | Quantization: int4
→ Recommends H100 80GB x1 with QLoRA
```

### `launch-pod`

Configure and launch a GPU pod from preset templates:

- **pytorch** — General deep learning (training, fine-tuning, research)
- **unsloth** — Fast LoRA/QLoRA fine-tuning (2-5x speedup)
- **skyrl** — Reinforcement learning (RLHF, PPO, GRPO)
- **comfyui** — Image generation (Stable Diffusion, SDXL, Flux)

### `serve-model`

Deploy a model for inference. Supports multiple serving frameworks (vLLM, TGI, Triton) and deployment modes:

| Mode | Description |
|------|-------------|
| **POD** | Single GPU instance via `pod_create` — good for dev/testing |
| **ALB** | HTTP load balancer via `serverless_create` — real-time inference at scale |
| **QUEUE** | Async job queue — batch/long-running jobs |
| **CUSTOM** | Raw container — gRPC or custom protocols |

## Agent Skills

The `skills/yotta-agent-skills/SKILL.md` file provides structured knowledge for AI agents, including:

- VRAM estimation heuristics for sizing GPUs to models
- Template-to-image mapping for quick pod launches
- Serving framework selection guidance
- Step-by-step configuration workflows

Compatible with Claude Code and any agent framework that supports skill files.

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `YOTTA_API_KEY` | Yes | — | Yotta Platform API key |
| `YOTTA_API_BASE_URL` | No | `https://api.yottalabs.ai` | API base URL |

## Development

```bash
npm run dev          # Watch mode with hot reload
npm test             # Run tests
npm run test:watch   # Watch mode tests
npm run lint         # Type check
npm run build        # Compile TypeScript
```

### Project structure

```
src/
├── index.ts              # Server entry point
├── config.ts             # Environment configuration
├── api/
│   ├── client.ts         # HTTP client for Yotta V2 API
│   └── types.ts          # TypeScript interfaces
├── tools/
│   ├── vms.ts            # VM tools (6)
│   ├── pods.ts           # Pod tools (6)
│   ├── serverless.ts     # Serverless tools (14)
│   ├── volumes.ts        # Volume tools (6)
│   └── registry.ts       # Registry tools (5)
├── resources/
│   ├── index.ts          # GPU catalog resources
│   └── gpus.json         # GPU type definitions
└── prompts/
    ├── gpu-selector.ts   # GPU recommendation prompt
    ├── launch-pod.ts     # Pod launch prompt
    └── serve-model.ts    # Model serving prompt
skills/
└── yotta-agent-skills/
    └── SKILL.md          # Agent skill definitions
```

## License

MIT — see [LICENSE](LICENSE).
