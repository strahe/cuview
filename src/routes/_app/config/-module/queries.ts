import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCurioApi, useCurioConnection } from "@/contexts/curio-api-context";
import {
  type ConfigHistoryEntry,
  createConfigLayer,
  fetchConfigDefaults,
  fetchConfigHistory,
  fetchConfigHistoryEntry,
  fetchConfigLayer,
  fetchConfigSchema,
  saveConfigLayer,
} from "@/services/config-api";
import type { ConfigSchemaDocument, ConfigTopologyEntry } from "@/types/config";
import { configQueryKeys } from "./query-keys";
import type { ConfigHistoryEntryView, ConfigTopologyNodeView } from "./types";

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normalizeHistoryEntry(
  raw: ConfigHistoryEntry,
): ConfigHistoryEntryView {
  return {
    id: raw.id,
    layer: raw.layer ?? "",
    createdAt: raw.created_at ?? "",
    content: raw.content ?? "",
  };
}

function normalizeTopologyNode(
  raw: ConfigTopologyEntry,
): ConfigTopologyNodeView {
  const id = raw.Server ?? raw.server ?? raw.id ?? raw.ID;
  const name = raw.Name ?? raw.name;
  const layersStr = raw.LayersCSV ?? raw.layersCSV ?? raw.layers_csv ?? "";

  const cpu = raw.CPU ?? raw.cpu ?? raw.Cpu;
  const gpu = raw.GPU ?? raw.gpu ?? raw.Gpu;
  const ram = raw.RAM ?? raw.ram ?? raw.Ram;

  return {
    id: id ?? name ?? "",
    name: name ?? String(id ?? ""),
    layers: layersStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    cpu: cpu?.toString(),
    gpu: gpu?.toString(),
    ram: typeof ram === "number" ? ram : ram?.toString(),
  };
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** List all config layer names. */
export function useConfigLayers() {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: [...configQueryKeys.layers, endpoint],
    queryFn: ({ signal }) =>
      api
        .restGet<string[]>("/api/config/layers", { signal })
        .then((r) => (Array.isArray(r) ? r : [])),
    refetchInterval: 60_000,
  });
}

/** Fetch a single layer's config JSON. */
export function useConfigLayer(name: string | null) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: [...configQueryKeys.layer(name ?? ""), endpoint],
    queryFn: ({ signal }) => fetchConfigLayer(api, name!, signal),
    enabled: name !== null && name !== "",
    refetchInterval: 60_000,
  });
}

/** Fetch the JSON Schema for config validation. */
export function useConfigSchema() {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: [...configQueryKeys.schema, endpoint],
    queryFn: ({ signal }) => fetchConfigSchema(api, signal),
    staleTime: 5 * 60_000,
    refetchInterval: false,
  });
}

/** Fetch the default (fully-populated) config. */
export function useConfigDefaults() {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: [...configQueryKeys.defaults, endpoint],
    queryFn: ({ signal }) => fetchConfigDefaults(api, signal),
    staleTime: 5 * 60_000,
    refetchInterval: false,
  });
}

/** Fetch cluster topology (machine → layers mapping). */
export function useConfigTopology() {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  const query = useQuery({
    queryKey: [...configQueryKeys.topology, endpoint],
    queryFn: ({ signal }) =>
      api
        .restGet<ConfigTopologyEntry[]>("/api/config/topo", { signal })
        .then((r) => (Array.isArray(r) ? r : [])),
    refetchInterval: 60_000,
  });

  const data = useMemo(
    () => (query.data ?? []).map(normalizeTopologyNode),
    [query.data],
  );

  return { ...query, data };
}

/** Fetch the last 20 history entries for a layer. */
export function useConfigHistory(layer: string | null) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  const query = useQuery({
    queryKey: [...configQueryKeys.history(layer ?? ""), endpoint],
    queryFn: ({ signal }) => fetchConfigHistory(api, layer!, signal),
    enabled: layer !== null && layer !== "",
    refetchInterval: false,
  });

  const data = useMemo(
    () => (query.data ?? []).map(normalizeHistoryEntry),
    [query.data],
  );

  return { ...query, data };
}

/** Fetch a specific history entry (includes diff data from backend). */
export function useConfigHistoryEntry(layer: string | null, id: number | null) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: [...configQueryKeys.historyEntry(layer ?? "", id ?? 0), endpoint],
    queryFn: ({ signal }) => fetchConfigHistoryEntry(api, layer!, id!, signal),
    enabled: layer !== null && layer !== "" && id !== null,
    refetchInterval: false,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new (empty) config layer. */
export function useCreateLayerMutation() {
  const api = useCurioApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createConfigLayer(api, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueryKeys.layers });
    },
  });
}

/** Save / update a config layer. */
export function useSaveLayerMutation(layer: string) {
  const api = useCurioApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      saveConfigLayer(api, layer, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueryKeys.layers });
      queryClient.invalidateQueries({
        queryKey: configQueryKeys.layer(layer),
      });
      queryClient.invalidateQueries({
        queryKey: configQueryKeys.history(layer),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Bundle hook for the visual editor
// ---------------------------------------------------------------------------

/**
 * Aggregates schema + defaults + layer data for the config editor.
 * Returns loading/error states and the merged data.
 */
export function useConfigEditorBundle(layerName: string | null) {
  const schemaQuery = useConfigSchema();
  const defaultsQuery = useConfigDefaults();
  const layerQuery = useConfigLayer(layerName);

  const isLoading =
    schemaQuery.isLoading || defaultsQuery.isLoading || layerQuery.isLoading;
  const error = schemaQuery.error ?? defaultsQuery.error ?? layerQuery.error;

  return {
    schema: (schemaQuery.data ?? null) as ConfigSchemaDocument | null,
    defaults: (defaultsQuery.data ?? null) as Record<string, unknown> | null,
    layerData: (layerQuery.data ?? null) as Record<string, unknown> | null,
    isLoading,
    error,
    refetchLayer: layerQuery.refetch,
  };
}
