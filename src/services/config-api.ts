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
  const schema = normalizeConfigSchemaResponse(response);
  if (!schema) return null;
  return sanitizeSchemaPatterns(schema) as ConfigSchemaDocument;
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

/** Detail response from GET /api/config/history/{layer}/{id} */
export interface ConfigHistoryEntryDetail {
  id: number;
  title: string;
  old_config: string;
  new_config: string;
  changed_at: string;
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
): Promise<ConfigHistoryEntryDetail | null> {
  const response = await api.restGet<ConfigHistoryEntryDetail>(
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

/**
 * Curio's backend schema uses the `pattern` field for example values
 * (e.g. "0h0m0s", "1 fil/0.03 fil") rather than real regex patterns.
 * AJV strictly validates these as regex, causing false validation failures.
 *
 * This function recursively detects non-regex pattern values, moves them
 * into the description as format hints, and removes them from `pattern`.
 */
export function sanitizeSchemaPatterns(
  schema: unknown,
): Record<string, unknown> | unknown {
  if (typeof schema !== "object" || schema === null) return schema;
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaPatterns);
  }

  const obj = schema as Record<string, unknown>;
  const result = { ...obj };

  if (typeof result.pattern === "string" && !isLikelyRegex(result.pattern)) {
    const hint = `Format: ${result.pattern}`;
    if (typeof result.description === "string" && result.description.trim()) {
      result.description = `${result.description} (${hint})`;
    } else {
      result.description = hint;
    }
    delete result.pattern;
  }

  // Recurse into properties and definitions
  for (const key of ["properties", "$defs", "definitions"]) {
    const sub = result[key];
    if (sub && typeof sub === "object" && !Array.isArray(sub)) {
      result[key] = Object.fromEntries(
        Object.entries(sub as Record<string, unknown>).map(([k, v]) => [
          k,
          sanitizeSchemaPatterns(v),
        ]),
      );
    }
  }

  if (result.items && typeof result.items === "object") {
    result.items = sanitizeSchemaPatterns(result.items);
  }

  if (
    result.additionalProperties &&
    typeof result.additionalProperties === "object"
  ) {
    result.additionalProperties = sanitizeSchemaPatterns(
      result.additionalProperties,
    );
  }

  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map(sanitizeSchemaPatterns);
    }
  }

  return result;
}

/**
 * Returns true if the string contains regex-specific constructs,
 * indicating it is intentionally a regex pattern rather than an example value.
 */
function isLikelyRegex(pattern: string): boolean {
  return /[[\](){}^$|\\+*?]/.test(pattern);
}
