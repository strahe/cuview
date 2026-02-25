import type { CurioApiService } from "@/services/curio-api";
import type {
  ConfigLayerResponse,
  ConfigSchemaDocument,
  ConfigTopologyEntry,
} from "@/types/config";

const getLayerEndpoint = (layer: string): string => {
  return `/api/config/layers/${encodeURIComponent(layer)}`;
};

export async function fetchConfigLayers(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await api.restGet<string[]>("/api/config/layers", {
    signal,
  });
  return Array.isArray(response) ? response : [];
}

export async function fetchConfigTopology(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<ConfigTopologyEntry[]> {
  const response = await api.restGet<ConfigTopologyEntry[]>(
    "/api/config/topo",
    { signal },
  );
  return Array.isArray(response) ? response : [];
}

export async function fetchConfigDefaults(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<ConfigLayerResponse> {
  const response = await api.restGet<ConfigLayerResponse>(
    "/api/config/default",
    { signal },
  );
  return response ?? {};
}

export async function fetchConfigSchema(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<ConfigSchemaDocument | null> {
  const response = await api.restGet<unknown>("/api/config/schema", {
    signal,
  });
  return normalizeConfigSchemaResponse(response);
}

export async function fetchConfigLayer(
  api: CurioApiService,
  layer: string,
  signal?: AbortSignal,
): Promise<ConfigLayerResponse> {
  const response = await api.restGet<ConfigLayerResponse>(
    getLayerEndpoint(layer),
    { signal },
  );
  return response ?? {};
}

export async function saveConfigLayer(
  api: CurioApiService,
  layer: string,
  payload: ConfigLayerResponse,
): Promise<void> {
  await api.restPost(getLayerEndpoint(layer), payload);
}

export async function createConfigLayer(
  api: CurioApiService,
  name: string,
): Promise<void> {
  await api.restPost("/api/config/addlayer", { name });
}

export interface ConfigHistoryEntry {
  id: number;
  layer: string;
  created_at: string;
  content: string;
}

export async function fetchConfigHistory(
  api: CurioApiService,
  layer: string,
  signal?: AbortSignal,
): Promise<ConfigHistoryEntry[]> {
  const response = await api.restGet<ConfigHistoryEntry[]>(
    `/api/config/history/${encodeURIComponent(layer)}`,
    { signal },
  );
  return Array.isArray(response) ? response : [];
}

export async function fetchConfigHistoryEntry(
  api: CurioApiService,
  layer: string,
  id: number,
  signal?: AbortSignal,
): Promise<ConfigHistoryEntry | null> {
  const response = await api.restGet<ConfigHistoryEntry>(
    `/api/config/history/${encodeURIComponent(layer)}/${id}`,
    { signal },
  );
  return response ?? null;
}

function normalizeConfigSchemaResponse(
  response: unknown,
): ConfigSchemaDocument | null {
  if (isConfigSchemaDocument(response)) {
    return response;
  }
  if (typeof response !== "object" || response === null) {
    return null;
  }

  const wrapped = response as {
    schema?: unknown;
    Schema?: unknown;
  };

  if (isConfigSchemaDocument(wrapped.schema)) {
    return wrapped.schema;
  }
  if (isConfigSchemaDocument(wrapped.Schema)) {
    return wrapped.Schema;
  }
  return null;
}

function isConfigSchemaDocument(value: unknown): value is ConfigSchemaDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    "$schema" in candidate ||
    "properties" in candidate ||
    "$defs" in candidate ||
    "definitions" in candidate ||
    "$ref" in candidate ||
    "type" in candidate
  );
}
