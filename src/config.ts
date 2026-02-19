export interface Config {
  apiBaseUrl: string;
  apiKey: string;
}

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;

  const apiKey = process.env.YOTTA_API_KEY;
  if (!apiKey) throw new Error("YOTTA_API_KEY environment variable is required");

  _config = {
    apiBaseUrl: (process.env.YOTTA_API_BASE_URL || "https://api.test.yottalabs.ai").replace(/\/$/, ""),
    apiKey,
  };
  return _config;
}
