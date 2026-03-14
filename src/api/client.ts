import { getConfig } from "../config.js";
import type {
  ApiResponse,
  PaginatedData,
  RegistryCredential,
  CreateRegistryCredentialRequest,
  UpdateRegistryCredentialRequest,
  Vm,
  CreateVmRequest,
  ListVmsParams,
  VmType,
  Pod,
  CreatePodRequest,
  Serverless,
  CreateServerlessRequest,
  UpdateServerlessRequest,
  ServerlessWorker,
  ServerlessTask,
  TaskCount,
  SubmitTaskRequest,
  SubmitTaskResponse,
  WorkerLogsResponse,
  Volume,
  CreateVolumeRequest,
  ListVolumesParams,
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
        "X-API-Key": this.apiKey,
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

  listVms(params?: ListVmsParams) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request<PaginatedData<Vm>>("GET", `/vms${qs ? `?${qs}` : ""}`);
  }

  getVmTypes() {
    return this.request<VmType[]>("GET", "/vms/types");
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

  // --- Serverless ---

  createServerless(req: CreateServerlessRequest) {
    return this.request<Serverless>("POST", "/serverless", req);
  }

  getServerless(id: string) {
    return this.request<Serverless>("GET", `/serverless/${id}`);
  }

  listServerless(statusList?: string) {
    const qs = statusList ? `?statusList=${statusList}` : "";
    return this.request<Serverless[]>("GET", `/serverless${qs}`);
  }

  updateServerless(id: string, req: UpdateServerlessRequest) {
    return this.request<Serverless>("PATCH", `/serverless/${id}`, req);
  }

  deleteServerless(id: string) {
    return this.request<boolean>("DELETE", `/serverless/${id}`);
  }

  stopServerless(id: string) {
    return this.request<unknown>("POST", `/serverless/${id}/stop`);
  }

  startServerless(id: string) {
    return this.request<unknown>("POST", `/serverless/${id}/start`);
  }

  scaleServerlessWorkers(id: string, count: number) {
    return this.request<unknown>("PUT", `/serverless/${id}/workers?count=${count}`);
  }

  listServerlessWorkers(id: string, statusList?: string) {
    const qs = statusList ? `?statusList=${statusList}` : "";
    return this.request<ServerlessWorker[]>("GET", `/serverless/${id}/workers${qs}`);
  }

  listServerlessTasks(id: string, params?: { status?: string; pageNumber?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.pageNumber) query.set("pageNumber", String(params.pageNumber));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const qs = query.toString();
    return this.request<PaginatedData<ServerlessTask>>("GET", `/serverless/${id}/tasks${qs ? `?${qs}` : ""}`);
  }

  getServerlessTaskCount(id: string) {
    return this.request<TaskCount>("GET", `/serverless/${id}/tasks/count`);
  }

  submitServerlessTask(id: string, req: SubmitTaskRequest) {
    return this.request<SubmitTaskResponse>("POST", `/serverless/${id}/tasks`, req);
  }

  getServerlessTask(endpointId: string, taskId: string) {
    return this.request<ServerlessTask>("GET", `/serverless/${endpointId}/tasks/${taskId}`);
  }

  getServerlessWorkerLogs(endpointId: string, workerId: string, params?: {
    pageSize?: number;
    keyword?: string;
    startTime?: string;
    endTime?: string;
    searchAfterTime?: string;
    searchAfterOffset?: number;
    direction?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.keyword) query.set("keyword", params.keyword);
    if (params?.startTime) query.set("startTime", params.startTime);
    if (params?.endTime) query.set("endTime", params.endTime);
    if (params?.searchAfterTime) query.set("searchAfterTime", params.searchAfterTime);
    if (params?.searchAfterOffset !== undefined) query.set("searchAfterOffset", String(params.searchAfterOffset));
    if (params?.direction) query.set("direction", params.direction);
    const qs = query.toString();
    return this.request<WorkerLogsResponse>("GET", `/serverless/${endpointId}/workers/${workerId}/logs${qs ? `?${qs}` : ""}`);
  }

  // --- Volumes ---

  createVolume(req: CreateVolumeRequest) {
    return this.request<Volume>("POST", "/volumes", req);
  }

  listVolumes(params: ListVolumesParams) {
    const query = new URLSearchParams();
    query.set("storageType", params.storageType);
    if (params.page) query.set("page", String(params.page));
    if (params.size) query.set("size", String(params.size));
    if (params.region) query.set("region", params.region);
    return this.request<PaginatedData<Volume>>("GET", `/volumes?${query.toString()}`);
  }

  getVolume(id: number) {
    return this.request<Volume>("GET", `/volumes/${id}`);
  }

  deleteVolume(id: number) {
    return this.request<boolean>("DELETE", `/volumes/${id}`);
  }

  renameVolume(id: number, name: string) {
    return this.request<Volume>("POST", `/volumes/${id}/name`, { name });
  }

  resizeVolume(id: number, sizeInGb: number) {
    return this.request<null>("POST", `/volumes/${id}/resize`, { sizeInGb });
  }
}

let _client: YottaClient | null = null;

export function getClient(): YottaClient {
  if (!_client) _client = new YottaClient();
  return _client;
}
