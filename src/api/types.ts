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
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
}

// --- Container Registry ---

export interface RegistryCredential {
  id: number;
  name: string;
  type: string;
  createdAt: string;
}

export interface CreateRegistryCredentialRequest {
  name: string;
  type: string;
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
  volumeMountPaths?: Record<string, string>;
}

export interface ListVmsParams {
  page?: number;
  size?: number;
  status?: string;
}

export interface VmTypeRegion {
  region: string;
  regionName: string;
  available: boolean;
  vmTypeId: number;
}

export interface VmType {
  gpuType: string;
  regions: VmTypeRegion[];
}

// --- Pods ---

export interface PodExposePortRequest {
  port: number;
  protocol: string;
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

export interface PodPersistentVolume {
  volumeId: number;
  mountPath: string;
  needBackup?: boolean;
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
  createdAt: number;
  updatedAt?: number;
}

export interface CreatePodRequest {
  name: string;
  image: string;
  gpuType: string;
  gpuCount: number;
  regions?: string[];
  region?: string;
  containerRegistryAuthId?: number;
  imageRegistry?: string;
  imagePublicType?: string;
  resourceType?: string;
  containerVolumeInGb?: number;
  persistentVolumeInGb?: number;
  persistentMountPath?: string;
  shmInGb?: number;
  minSingleCardVramInGb?: number;
  minSingleCardRamInGb?: number;
  minSingleCardVcpu?: number;
  initializationCommand?: string;
  environmentVars?: { key: string; value: string }[];
  expose?: PodExposePortRequest[];
  persistentVolumes?: PodPersistentVolume[];
}

// --- Serverless ---

export interface Serverless {
  id: string;
  name: string;
  image: string;
  imageRegistry?: string;
  resources?: ServerlessResource[];
  containerVolumeInGb?: number;
  environmentVars?: { key: string; value: string }[];
  expose?: { port: number; protocol?: string };
  totalWorkers: number;
  runningWorkers: number;
  cost: number;
  perHourPrice?: number;
  perSecondPrice?: number;
  serviceMode: string;
  webhook?: string;
  status: string;
  domain?: string;
  creator?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServerlessResource {
  region: string;
  gpuType: string;
  gpuCount: number;
}

export interface CreateServerlessRequest {
  name: string;
  imageRegistry?: string;
  image: string;
  containerRegistryAuthId?: number;
  resources: ServerlessResource[];
  workers: number;
  containerVolumeInGb: number;
  environmentVars?: { key: string; value: string }[];
  expose?: {
    port: number;
    protocol: string;
  };
  serviceMode: string;
  webhook?: string;
  initializationCommand?: string;
}

export interface UpdateServerlessRequest {
  name: string;
  resources: ServerlessResource[];
  workers: number;
  containerVolumeInGb: number;
  minSingleCardVramInGb?: number;
  minSingleCardVcpu?: number;
  minSingleCardRamInGb?: number;
  credentialId?: number;
  initializationCommand?: string;
  envVars?: { key: string; value: string }[];
  expose?: { port: number; protocol: string };
  webhook?: string;
}

export interface ServerlessWorker {
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

export interface ServerlessTask {
  taskId: string;
  endpointId: number;
  endpointName: string;
  status: string;
  workerUrl: string;
  webhook: string | null;
  deliveryStatus: string;
  deliveryAttempts: number;
  error: string | null;
  input?: unknown;
  output?: unknown;
  headers?: Record<string, string>;
  createdAt: number;
  deliveredAt: number | null;
  updatedAt: number;
}

export interface TaskCount {
  processing: number;
}

// --- Task Submission ---

export interface SubmitTaskRequest {
  taskId?: string;
  input: unknown;
  workerPort: number;
  processUri: string;
  webhook?: string;
  webhookAuthKey?: string;
  headers?: Record<string, string>;
}

export interface SubmitTaskResponse {
  taskId: string;
}

// --- Worker Logs ---

export interface WorkerLogEntry {
  timestamp: string;
  log: string;
  offset: number;
}

export interface WorkerLogsResponse {
  logs: WorkerLogEntry[];
  hasMore: boolean;
  nextSearchAfterTime: string | null;
  nextSearchAfterOffset: string | null;
}

// --- Volumes ---

export interface Volume {
  id: number;
  name: string;
  sizeInGb: number | null;
  region: string | null;
  storageType: string;
  status: string;
  vendorVolumeType: string | null;
  mountCount: number;
  cost: number;
  createdAt: number;
}

export interface CreateVolumeRequest {
  name: string;
  storageType: string;
  region?: string;
  sizeInGb?: number;
  vendorVolumeType?: string;
}

export interface ListVolumesParams {
  storageType: string;
  page?: number;
  size?: number;
  region?: string;
}
