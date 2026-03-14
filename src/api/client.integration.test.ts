/**
 * Integration tests — run against the real Yotta API.
 *
 * Usage:
 *   YOTTA_API_KEY=<your-key> npm run test:integration
 *
 * All tests are skipped when YOTTA_API_KEY is not set.
 * Lifecycle tests (create/delete) clean up in afterAll — resources are deleted
 * even if the test fails, but a billing charge may occur for the brief time alive.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { getClient } from "./client.js";

const hasKey = !!process.env.YOTTA_API_KEY;

// --- VMs ---

describe.skipIf(!hasKey)("Integration: VMs", { timeout: 30_000 }, () => {
  let client: ReturnType<typeof getClient>;

  beforeAll(() => {
    client = getClient();
  });

  it("listVms returns paginated shape", async () => {
    const result = await client.listVms({ page: 1, size: 5 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      page: expect.any(Number),
      size: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it("getVmTypes returns an array of GPU types", async () => {
    const result = await client.getVmTypes();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toMatchObject({
        gpuType: expect.any(String),
        regions: expect.any(Array),
      });
    }
  });
});

describe.skipIf(!hasKey)("Integration: VM lifecycle", { timeout: 120_000 }, () => {
  let client: ReturnType<typeof getClient>;
  let createdVmId: number | undefined;

  beforeAll(() => {
    client = getClient();
  });

  afterAll(async () => {
    if (createdVmId !== undefined) {
      await client.terminateVm(createdVmId).catch(() => { /* best-effort cleanup */ });
    }
  });

  it("creates a VM then terminates it", async () => {
    // Dynamically pick first available VM type and region
    const types = await client.getVmTypes();
    const available = types.flatMap((t) =>
      t.regions.filter((r) => r.available).map((r) => ({ vmTypeId: r.vmTypeId, region: r.region }))
    );

    if (available.length === 0) {
      console.warn("No VM types available — skipping VM creation test");
      return;
    }

    const { vmTypeId, region } = available[0];
    const vm = await client.createVm({ vmTypeId, region, name: "integration-test-vm" });
    createdVmId = vm.id;

    expect(vm.name).toBe("integration-test-vm");
    expect(typeof vm.id).toBe("number");

    await client.terminateVm(createdVmId);
    createdVmId = undefined;
  });
});

// --- Pods ---

describe.skipIf(!hasKey)("Integration: Pods", { timeout: 30_000 }, () => {
  let client: ReturnType<typeof getClient>;

  beforeAll(() => {
    client = getClient();
  });

  it("listPods returns an array", async () => {
    const result = await client.listPods();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listPods with statusList=RUNNING returns only running pods", async () => {
    const result = await client.listPods({ statusList: "RUNNING" });
    expect(Array.isArray(result)).toBe(true);
    for (const pod of result) {
      expect(pod.status).toBe("RUNNING");
    }
  });
});

describe.skipIf(!hasKey)("Integration: Pod lifecycle", { timeout: 120_000 }, () => {
  let client: ReturnType<typeof getClient>;
  let createdPodId: number | undefined;

  beforeAll(() => {
    client = getClient();
  });

  afterAll(async () => {
    if (createdPodId !== undefined) {
      await client.deletePod(createdPodId).catch(() => { /* best-effort cleanup */ });
    }
  });

  it("creates a pod then deletes it", async () => {
    const pod = await client.createPod({
      name: "integration-test-pod",
      image: "ubuntu:22.04",
      gpuType: "RTX_4090_24G",
      gpuCount: 1,
    });
    createdPodId = pod.id;

    expect(pod.name).toBe("integration-test-pod");
    expect(typeof pod.id).toBe("number");

    await client.deletePod(createdPodId);
    createdPodId = undefined;
  });
});

// --- Serverless ---

describe.skipIf(!hasKey)("Integration: Serverless", { timeout: 30_000 }, () => {
  let client: ReturnType<typeof getClient>;

  beforeAll(() => {
    client = getClient();
  });

  it("listServerless returns an array", async () => {
    const result = await client.listServerless();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe.skipIf(!hasKey)("Integration: Serverless lifecycle", { timeout: 120_000 }, () => {
  let client: ReturnType<typeof getClient>;
  let createdId: string | undefined;

  beforeAll(() => {
    client = getClient();
  });

  afterAll(async () => {
    if (createdId !== undefined) {
      await client.deleteServerless(createdId).catch(() => { /* best-effort cleanup */ });
    }
  });

  it("creates a serverless endpoint then deletes it", async () => {
    const ep = await client.createServerless({
      name: "integration-test-ep",
      image: "ubuntu:22.04",
      resources: [{ region: "us-east-1", gpuType: "RTX_4090_24G", gpuCount: 1 }],
      workers: 1,
      containerVolumeInGb: 20,
      serviceMode: "CUSTOM",
    });
    createdId = ep.id;

    expect(ep.name).toBe("integration-test-ep");
    expect(typeof ep.id).toBe("string");

    await client.deleteServerless(createdId);
    createdId = undefined;
  });
});

// --- Registry ---

describe.skipIf(!hasKey)("Integration: Registry", { timeout: 30_000 }, () => {
  let client: ReturnType<typeof getClient>;

  beforeAll(() => {
    client = getClient();
  });

  it("listRegistryCredentials returns an array", async () => {
    const result = await client.listRegistryCredentials();
    expect(Array.isArray(result)).toBe(true);
  });
});

// --- Volumes ---

describe.skipIf(!hasKey)("Integration: Volumes", { timeout: 30_000 }, () => {
  let client: ReturnType<typeof getClient>;

  beforeAll(() => {
    client = getClient();
  });

  it("listVolumes(S3) returns paginated shape", async () => {
    const result = await client.listVolumes({ storageType: "S3", page: 1, size: 5 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      page: expect.any(Number),
      size: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it("listVolumes(CEPH) returns paginated shape", async () => {
    const result = await client.listVolumes({ storageType: "CEPH", page: 1, size: 5 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      page: expect.any(Number),
      size: expect.any(Number),
      total: expect.any(Number),
    });
  });
});

describe.skipIf(!hasKey)("Integration: Volume lifecycle", { timeout: 60_000 }, () => {
  let client: ReturnType<typeof getClient>;
  let createdVolumeId: number | undefined;

  beforeAll(() => {
    client = getClient();
  });

  afterAll(async () => {
    if (createdVolumeId !== undefined) {
      await client.deleteVolume(createdVolumeId).catch(() => { /* best-effort cleanup */ });
    }
  });

  it("creates a CEPH volume then deletes it", async () => {
    const volume = await client.createVolume({
      name: "integration-test-vol",
      storageType: "CEPH",
      sizeInGb: 10,
    });
    createdVolumeId = volume.id;

    expect(volume.name).toBe("integration-test-vol");
    expect(volume.storageType).toBe("CEPH");
    expect(typeof volume.id).toBe("number");

    await client.deleteVolume(createdVolumeId);
    createdVolumeId = undefined;
  });
});

// --- Authentication (last — uses vi.resetModules to create a fresh client) ---

describe.skipIf(!hasKey)("Integration: Authentication", { timeout: 15_000 }, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects an invalid API key with an error", async () => {
    vi.stubEnv("YOTTA_API_KEY", "invalid-key-that-does-not-exist-xyz");
    vi.resetModules();
    const { getClient: getFreshClient } = await import("./client.js");
    await expect(getFreshClient().listPods()).rejects.toThrow();
  });
});
