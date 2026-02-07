// --- GPU Catalog ---

export interface GpuType {
  gpuType: string;
  displayName: string;
  vramGb: number;
  pricePerHour: number;
  regions: string[];
}

// Standard Yotta API response wrapper
export interface ApiResponse<T> {
  message: string;
  code: number;
  data: T;
}

// Pagination
export interface PaginatedData<T> {
  pageNumber: number;
  pageSize: number;
  totalPage: number;
  totalRow: number;
  records: T[];
}

// --- Container Registry ---

export interface RegistryCredential {
  id: number;
  name: string;
  type: "DOCKER_HUB" | "GCR" | "ECR" | "ACR" | "PRIVATE";
  createdAt: string;
}

export interface CreateRegistryCredentialRequest {
  name: string;
  type: "DOCKER_HUB" | "GCR" | "ECR" | "ACR" | "PRIVATE";
  username: string;
  password: string;
}

export interface UpdateRegistryCredentialRequest {
  name?: string;
  username?: string;
  password?: string;
}

// --- VMs ---

export interface Vm {
  id: number;
  name: string;
  status: string;
  gpuDisplayName: string;
  ipAddress: string;
  cpuCores: number;
  memoryInGb: string;
  gpuCount: number;
  gpuMemoryInGb: string;
  region: string;
  storageInGb: string;
  sshTemplate: string;
  createdAt: string;
  isSpot: number;
}

export interface CreateVmRequest {
  vmTypeId: number;
  region: string;
  name: string;
  isSpot?: number;
}

export interface ListVmsRequest {
  pageNumber: number;
  pageSize: number;
  search?: {
    status?: string;
  };
}

// --- Pods ---

export interface Pod {
  id: number;
  name: string;
  image: string;
  gpuType: string;
  gpuDisplayName: string;
  gpuCount: number;
  status: string;
  createdAt: string;
  sshCmd?: string;
}

export interface CreatePodRequest {
  name: string;
  image: string;
  gpuType: string;
  gpuCount: number;
  containerVolumeInGb?: number;
  envVars?: { key: string; value: string }[];
  ports?: number[];
}

// --- Endpoints ---

export interface Endpoint {
  id: string;
  name: string;
  image: string;
  status: string;
  totalWorkers: number;
  runningWorkers: number;
  cost: number;
  serviceMode: "ALB" | "QUEUE" | "CUSTOM";
  createdAt: string;
}

export interface EndpointResource {
  region: string;
  gpuType: string;
  gpuCount: number;
}

export interface CreateEndpointRequest {
  name: string;
  imageRegistry?: string;
  image: string;
  resources: EndpointResource[];
  workers: number;
  containerVolumeInGb: number;
  envVars?: { key: string; value: string }[];
  expose?: {
    port: number;
    protocol: string;
    proxyPort?: number;
  };
  serviceMode: "ALB" | "QUEUE" | "CUSTOM";
}

export interface UpdateEndpointRequest {
  name?: string;
  workers?: number;
  envVars?: { key: string; value: string }[];
}

export interface EndpointWorker {
  id: string;
  status: string;
}

export interface EndpointTask {
  taskId: string;
  endpointId: number;
  endpointName: string;
  userId: number;
  status: number;
  statusDescription: string;
  workerUrl: string;
  webhookUrl: string;
  deliveryStatus: number;
  deliveryAttempts: number;
  errorMessage: string | null;
  createdAt: string;
  deliveredAt: string;
  updatedAt: string;
}

export interface TaskCount {
  total: number;
  processing: number;
  delivered: number;
  success: number;
  failed: number;
}
