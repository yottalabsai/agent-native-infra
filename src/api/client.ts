import { getConfig } from "../config.js";
import type {
  ApiResponse,
  PaginatedData,
  RegistryCredential,
  CreateRegistryCredentialRequest,
  UpdateRegistryCredentialRequest,
  Vm,
  CreateVmRequest,
  ListVmsRequest,
  Pod,
  CreatePodRequest,
  Endpoint,
  CreateEndpointRequest,
  UpdateEndpointRequest,
  EndpointWorker,
  EndpointTask,
  TaskCount,
} from "./types.js";

class YottaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.apiBaseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/v2${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Yotta API ${method} ${path} failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (json.code !== 10000) {
      throw new Error(`Yotta API error (${json.code}): ${json.message}`);
    }
    return json.data;
  }

  // --- Container Registry ---

  listRegistryCredentials() {
    return this.request<RegistryCredential[]>("GET", "/container-registry-auths");
  }

  getRegistryCredential(id: number) {
    return this.request<RegistryCredential>("GET", `/container-registry-auths/${id}`);
  }

  createRegistryCredential(req: CreateRegistryCredentialRequest) {
    return this.request<RegistryCredential>("POST", "/container-registry-auths", req);
  }

  updateRegistryCredential(id: number, req: UpdateRegistryCredentialRequest) {
    return this.request<RegistryCredential>("PATCH", `/container-registry-auths/${id}`, req);
  }

  deleteRegistryCredential(id: number) {
    return this.request<boolean>("DELETE", `/container-registry-auths/${id}`);
  }

  // --- VMs ---

  createVm(req: CreateVmRequest) {
    return this.request<Vm>("POST", "/vms", req);
  }

  getVm(id: number) {
    return this.request<Vm>("GET", `/vms/${id}`);
  }

  listVms(req: ListVmsRequest) {
    return this.request<PaginatedData<Vm>>("POST", "/vms/list", req);
  }

  renameVm(id: number, name: string) {
    return this.request<Vm>("PATCH", `/vms/${id}`, { name });
  }

  terminateVm(id: number) {
    return this.request<boolean>("DELETE", `/vms/${id}`);
  }

  // --- Pods ---

  createPod(req: CreatePodRequest) {
    return this.request<Pod>("POST", "/pods", req);
  }

  getPod(id: number) {
    return this.request<Pod>("GET", `/pods/${id}`);
  }

  listPods(params?: { regionList?: string; statusList?: string }) {
    const query = new URLSearchParams();
    if (params?.regionList) query.set("regionList", params.regionList);
    if (params?.statusList) query.set("statusList", params.statusList);
    const qs = query.toString();
    return this.request<Pod[]>("GET", `/pods${qs ? `?${qs}` : ""}`);
  }

  deletePod(id: number) {
    return this.request<boolean>("DELETE", `/pods/${id}`);
  }

  pausePod(id: number) {
    return this.request<unknown>("POST", `/pods/${id}/pause`);
  }

  resumePod(id: number) {
    return this.request<unknown>("POST", `/pods/${id}/resume`);
  }

  // --- Endpoints ---

  createEndpoint(req: CreateEndpointRequest) {
    return this.request<Endpoint>("POST", "/endpoints", req);
  }

  getEndpoint(id: number) {
    return this.request<Endpoint>("GET", `/endpoints/${id}`);
  }

  listEndpoints(statusList?: string) {
    const qs = statusList ? `?statusList=${statusList}` : "";
    return this.request<Endpoint[]>("GET", `/endpoints${qs}`);
  }

  updateEndpoint(id: number, req: UpdateEndpointRequest) {
    return this.request<Endpoint>("PATCH", `/endpoints/${id}`, req);
  }

  deleteEndpoint(id: number) {
    return this.request<boolean>("DELETE", `/endpoints/${id}`);
  }

  stopEndpoint(id: number) {
    return this.request<unknown>("POST", `/endpoints/${id}/stop`);
  }

  startEndpoint(id: number) {
    return this.request<unknown>("POST", `/endpoints/${id}/start`);
  }

  scaleEndpointWorkers(id: number, count: number) {
    return this.request<unknown>("PUT", `/endpoints/${id}/workers?count=${count}`);
  }

  listEndpointWorkers(id: number, statusList?: string) {
    const qs = statusList ? `?statusList=${statusList}` : "";
    return this.request<EndpointWorker[]>("GET", `/endpoints/${id}/workers${qs}`);
  }

  listEndpointTasks(id: number, params?: { status?: number; pageNumber?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.status !== undefined) query.set("status", String(params.status));
    if (params?.pageNumber) query.set("pageNumber", String(params.pageNumber));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const qs = query.toString();
    return this.request<PaginatedData<EndpointTask>>("GET", `/endpoints/${id}/tasks${qs ? `?${qs}` : ""}`);
  }

  getEndpointTaskCount(id: number) {
    return this.request<TaskCount>("GET", `/endpoints/${id}/tasks/count`);
  }
}

let _client: YottaClient | null = null;

export function getClient(): YottaClient {
  if (!_client) _client = new YottaClient();
  return _client;
}
