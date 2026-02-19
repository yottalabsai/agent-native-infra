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
  createdAt: string;
}

export interface CreateRegistryCredentialRequest {
  name: string;
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
  gpuType?: string;
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
  updatedAt?: string;
  terminatedAt?: string;
  isSpot: number;
  osInfo?: string;
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

export interface PodExposePort {
  port: number;
  protocol?: string;
}

export interface PodExposePortResponse {
  port: number;
  proxyPort?: number;
  protocol?: string;
  host?: string;
  healthy?: boolean;
  ingressUrl?: string;
  serviceName?: string;
}

export interface Pod {
  id: number;
  name: string;
  image: string;
  imageRegistry?: string;
  gpuType: string;
  gpuDisplayName: string;
  gpuCount: number;
  resourceType?: string;
  region?: string;
  cloudType?: string;
  containerVolumeInGb?: number;
  shmInGb?: number;
  singleCardVramInGb?: number;
  singleCardRamInGb?: number;
  singleCardVcpu?: number;
  singleCardPrice?: number;
  environmentVars?: { key: string; value: string }[];
  expose?: PodExposePortResponse[];
  initializationCommand?: string;
  sshCmd?: string;
  internalIp?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePodRequest {
  name: string;
  image: string;
  gpuType: string;
  gpuCount: number;
  region?: string;
  regionList?: string[];
  containerRegistryAuthId?: number;
  imageRegistry?: string;
  containerVolumeInGb?: number;
  initializationCommand?: string;
  environmentVars?: { key: string; value: string }[];
  expose?: PodExposePort[];
}

// --- Endpoints ---

export interface Endpoint {
  id: number;
  name: string;
  image: string;
  imageRegistry?: string;
  resources?: EndpointResource[];
  containerVolumeInGb?: number;
  environmentVars?: { key: string; value: string }[];
  expose?: { port: number; protocol?: string };
  totalWorkers: number;
  runningWorkers: number;
  cost: number;
  perHourPrice?: number;
  perSecondPrice?: number;
  serviceMode: string;
  status: string;
  domain?: string;
  creator?: string;
  createdAt: string;
  updatedAt?: string;
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
  serviceMode: string;
  initializationCommand?: string;
  credentialId?: number;
}

export interface UpdateEndpointRequest {
  name?: string;
  workers?: number;
  envVars?: { key: string; value: string }[];
}

export interface EndpointWorker {
  id: string;
  region?: string;
  gpuType?: string;
  gpuDisplayName?: string;
  gpuCount?: number;
  singleCardVramInGb?: number;
  singleCardVcpu?: number;
  singleCardRamInGb?: number;
  uptime?: number;
  cost?: number;
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
