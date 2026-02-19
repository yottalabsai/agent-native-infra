import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock config so the client can construct without real env vars
vi.mock("../config.js", () => ({
  getConfig: () => ({
    apiBaseUrl: "https://test.yotta.com",
    apiKey: "test-api-key",
  }),
}));

// Helper to mock global fetch
function mockFetch(data: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ message: "success", code: 10000, data }),
    text: () => Promise.resolve(JSON.stringify({ message: "error", code: 10001 })),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

// Must re-import after mocking to reset the client singleton
async function freshClient() {
  vi.resetModules();
  // Re-apply the config mock after resetModules
  vi.doMock("../config.js", () => ({
    getConfig: () => ({
      apiBaseUrl: "https://test.yotta.com",
      apiKey: "test-api-key",
    }),
  }));
  const { getClient } = await import("./client.js");
  return getClient();
}

describe("YottaClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("request basics", () => {
    it("sends correct Authorization header", async () => {
      const fetchMock = mockFetch([]);
      const client = await freshClient();
      await client.listPods();
      expect(fetchMock).toHaveBeenCalledOnce();
      const [, opts] = fetchMock.mock.calls[0];
      expect(opts.headers.Authorization).toBe("Bearer test-api-key");
    });

    it("prefixes paths with /v2", async () => {
      const fetchMock = mockFetch([]);
      const client = await freshClient();
      await client.listPods();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/pods");
    });

    it("sends JSON body for POST requests", async () => {
      const fetchMock = mockFetch({ id: 1 });
      const client = await freshClient();
      await client.createVm({ vmTypeId: 1, region: "us-east-1", name: "test" });
      const [, opts] = fetchMock.mock.calls[0];
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toEqual({ vmTypeId: 1, region: "us-east-1", name: "test" });
    });

    it("does not send body for GET requests", async () => {
      const fetchMock = mockFetch({ id: 1 });
      const client = await freshClient();
      await client.getVm(42);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/vms/42");
      expect(opts.method).toBe("GET");
      expect(opts.body).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("throws on non-ok HTTP response", async () => {
      const fn = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });
      vi.stubGlobal("fetch", fn);
      const client = await freshClient();
      await expect(client.listPods()).rejects.toThrow("failed (401): Unauthorized");
    });

    it("throws on non-10000 API code", async () => {
      const fn = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: "VM not found", code: 11000, data: null }),
      });
      vi.stubGlobal("fetch", fn);
      const client = await freshClient();
      await expect(client.getVm(999)).rejects.toThrow("Yotta API error (11000): VM not found");
    });
  });

  describe("VMs", () => {
    it("listVms sends POST to /vms/list", async () => {
      const fetchMock = mockFetch({ pageNumber: 1, pageSize: 10, totalPage: 1, totalRow: 0, records: [] });
      const client = await freshClient();
      await client.listVms({ pageNumber: 1, pageSize: 10 });
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/vms/list");
      expect(opts.method).toBe("POST");
    });

    it("terminateVm sends DELETE", async () => {
      const fetchMock = mockFetch(true);
      const client = await freshClient();
      await client.terminateVm(5);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/vms/5");
      expect(opts.method).toBe("DELETE");
    });
  });

  describe("Pods", () => {
    it("listPods appends query params when provided", async () => {
      const fetchMock = mockFetch([]);
      const client = await freshClient();
      await client.listPods({ regionList: "us-east-1", statusList: "RUNNING" });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("regionList=us-east-1");
      expect(url).toContain("statusList=RUNNING");
    });

    it("listPods omits query params when not provided", async () => {
      const fetchMock = mockFetch([]);
      const client = await freshClient();
      await client.listPods();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/pods");
    });

    it("pausePod sends POST to /pods/{id}/pause", async () => {
      const fetchMock = mockFetch(null);
      const client = await freshClient();
      await client.pausePod(7);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/pods/7/pause");
      expect(opts.method).toBe("POST");
    });
  });

  describe("Endpoints", () => {
    it("scaleEndpointWorkers sends PUT with count query param", async () => {
      const fetchMock = mockFetch(null);
      const client = await freshClient();
      await client.scaleEndpointWorkers(1, 4);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/endpoints/1/workers?count=4");
      expect(opts.method).toBe("PUT");
    });

    it("listEndpointTasks builds query string", async () => {
      const fetchMock = mockFetch({ pageNumber: 1, pageSize: 10, totalRow: 0, records: [] });
      const client = await freshClient();
      await client.listEndpointTasks(1, { status: 2, pageNumber: 1, pageSize: 5 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("status=2");
      expect(url).toContain("pageNumber=1");
      expect(url).toContain("pageSize=5");
    });
  });

  describe("Registry", () => {
    it("createRegistryCredential sends POST", async () => {
      const fetchMock = mockFetch({ id: 1, name: "test", createdAt: "2024-01-01T00:00:00Z" });
      const client = await freshClient();
      await client.createRegistryCredential({ name: "test", username: "u", password: "p" });
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.yotta.com/v2/container-registry-auths");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toMatchObject({ name: "test", username: "u" });
    });
  });
});
