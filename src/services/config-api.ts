import { useCurioApi } from "@/composables/useCurioQuery";
import type {
  ConfigLayerResponse,
  ConfigSchemaDocument,
  ConfigTopologyEntry,
} from "@/types/config";

const getLayerEndpoint = (layer: string): string => {
  return `/api/config/layers/${encodeURIComponent(layer)}`;
};

export async function fetchConfigLayers(
  signal?: AbortSignal,
): Promise<string[]> {
  const api = useCurioApi();
  const response = await api.restGet<string[]>("/api/config/layers", {
    signal,
  });
  return Array.isArray(response) ? response : [];
}

export async function fetchConfigTopology(
  signal?: AbortSignal,
): Promise<ConfigTopologyEntry[]> {
  const api = useCurioApi();
  const response = await api.restGet<ConfigTopologyEntry[]>(
    "/api/config/topo",
    {
      signal,
    },
  );
  return Array.isArray(response) ? response : [];
}

export async function fetchConfigDefaults(
  signal?: AbortSignal,
): Promise<ConfigLayerResponse> {
  const api = useCurioApi();
  const response = await api.restGet<ConfigLayerResponse>(
    "/api/config/default",
    {
      signal,
    },
  );
  return response ?? {};
}

export async function fetchConfigSchema(
  signal?: AbortSignal,
): Promise<ConfigSchemaDocument | null> {
  const api = useCurioApi();
  const response = await api.restGet<ConfigSchemaDocument>(
    "/api/config/schema",
    {
      signal,
    },
  );
  return response ?? null;
}

export async function fetchConfigLayer(
  layer: string,
  signal?: AbortSignal,
): Promise<ConfigLayerResponse> {
  const api = useCurioApi();
  const response = await api.restGet<ConfigLayerResponse>(
    getLayerEndpoint(layer),
    {
      signal,
    },
  );
  return response ?? {};
}

export async function saveConfigLayer(
  layer: string,
  payload: ConfigLayerResponse,
): Promise<void> {
  const api = useCurioApi();
  await api.restPost(getLayerEndpoint(layer), payload);
}

export async function createConfigLayer(name: string): Promise<void> {
  const api = useCurioApi();
  await api.restPost("/api/config/addlayer", { name });
}
