// Re-export core schema/API types from shared types
export type {
  ConfigLayerResponse,
  ConfigSchemaDocument,
  ConfigSchemaNode,
  ConfigTopologyEntry,
} from "@/types/config";

// ---------------------------------------------------------------------------
// URL search state
// ---------------------------------------------------------------------------

export type ConfigEditMode = "visual" | "json";
export type ConfigInfoDisplay = "icon" | "inline";

export interface ConfigSearchState {
  layer: string;
  mode: ConfigEditMode;
  infoDisplay: ConfigInfoDisplay;
}

export type ConfigSearchPatch = Partial<ConfigSearchState>;

// ---------------------------------------------------------------------------
// View models (normalised from API responses)
// ---------------------------------------------------------------------------

export interface ConfigHistoryEntryView {
  id: number;
  layer: string;
  createdAt: string;
  /** Raw TOML/JSON content snapshot */
  content: string;
}

export interface ConfigTopologyNodeView {
  id: string | number;
  name: string;
  layers: string[];
  cpu?: string;
  gpu?: string;
  ram?: string | number;
}

// ---------------------------------------------------------------------------
// Diff types
// ---------------------------------------------------------------------------

export type DiffLineKind = "added" | "removed" | "context";

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}

export interface ConfigDiffResult {
  oldLabel: string;
  newLabel: string;
  lines: DiffLine[];
}
