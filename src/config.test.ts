import { describe, it, expect, beforeEach, vi } from "vitest";

// Reset module cache between tests so the singleton resets
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("getConfig", () => {
  it("reads YOTTA_API_KEY from env", async () => {
    vi.stubEnv("YOTTA_API_KEY", "test-key-123");
    const { getConfig } = await import("./config.js");
    const config = getConfig();
    expect(config.apiKey).toBe("test-key-123");
  });

  it("uses default base URL when YOTTA_API_BASE_URL is not set", async () => {
    vi.stubEnv("YOTTA_API_KEY", "test-key");
    delete process.env.YOTTA_API_BASE_URL;
    const { getConfig } = await import("./config.js");
    const config = getConfig();
    expect(config.apiBaseUrl).toBe("https://api.yottalabs.ai");
  });

  it("uses custom base URL from env", async () => {
    vi.stubEnv("YOTTA_API_KEY", "test-key");
    vi.stubEnv("YOTTA_API_BASE_URL", "https://custom.yotta.io");
    const { getConfig } = await import("./config.js");
    const config = getConfig();
    expect(config.apiBaseUrl).toBe("https://custom.yotta.io");
  });

  it("strips trailing slash from base URL", async () => {
    vi.stubEnv("YOTTA_API_KEY", "test-key");
    vi.stubEnv("YOTTA_API_BASE_URL", "https://custom.yotta.io/");
    const { getConfig } = await import("./config.js");
    const config = getConfig();
    expect(config.apiBaseUrl).toBe("https://custom.yotta.io");
  });

  it("throws when YOTTA_API_KEY is missing", async () => {
    delete process.env.YOTTA_API_KEY;
    const { getConfig } = await import("./config.js");
    expect(() => getConfig()).toThrow("YOTTA_API_KEY environment variable is required");
  });

  it("caches config on subsequent calls", async () => {
    vi.stubEnv("YOTTA_API_KEY", "test-key");
    const { getConfig } = await import("./config.js");
    const first = getConfig();
    const second = getConfig();
    expect(first).toBe(second);
  });
});
