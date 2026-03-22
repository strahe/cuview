/**
 * React Query key constants for config REST endpoints.
 *
 * Keys follow the `["curio-rest", path-segment, ...]` convention used by
 * `useCurioRest` so that mutations can easily invalidate related queries.
 */

const prefix = "curio-rest" as const;

export const configQueryKeys = {
  /** All layers list */
  layers: [prefix, "/api/config/layers"] as const,
  /** Single layer config */
  layer: (name: string) => [prefix, "/api/config/layers", name] as const,
  /** JSON Schema */
  schema: [prefix, "/api/config/schema"] as const,
  /** Default config */
  defaults: [prefix, "/api/config/default"] as const,
  /** Cluster topology */
  topology: [prefix, "/api/config/topo"] as const,
  /** Layer change history list */
  history: (layer: string) => [prefix, "/api/config/history", layer] as const,
  /** Single history entry (with diff data) */
  historyEntry: (layer: string, id: number) =>
    [prefix, "/api/config/history", layer, id] as const,
};

/** Keys to invalidate after any write mutation (create/save layer). */
export const configInvalidateKeys: readonly (readonly unknown[])[] = [
  configQueryKeys.layers,
  // layer-specific and history keys are invalidated dynamically in mutations
];
