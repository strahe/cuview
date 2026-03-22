import type {
  ConfigEditMode,
  ConfigInfoDisplay,
  ConfigSearchPatch,
  ConfigSearchState,
} from "./types";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG_SEARCH: ConfigSearchState = {
  layer: "",
  mode: "visual",
  infoDisplay: "icon",
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function parseEditMode(value: unknown): ConfigEditMode {
  return value === "json" ? "json" : "visual";
}

function parseInfoDisplay(value: unknown): ConfigInfoDisplay {
  return value === "inline" ? "inline" : "icon";
}

// ---------------------------------------------------------------------------
// Normalise (incoming URL search → typed state)
// ---------------------------------------------------------------------------

export function normalizeConfigSearch(
  search: Record<string, unknown>,
): ConfigSearchState {
  return {
    layer:
      typeof search.layer === "string"
        ? search.layer
        : DEFAULT_CONFIG_SEARCH.layer,
    mode: parseEditMode(search.mode),
    infoDisplay: parseInfoDisplay(search.infoDisplay),
  };
}

// ---------------------------------------------------------------------------
// Patch (partial update from user interaction)
// ---------------------------------------------------------------------------

export function patchConfigSearch(
  prev: ConfigSearchState,
  patch: ConfigSearchPatch,
): ConfigSearchState {
  return normalizeConfigSearch({ ...prev, ...patch });
}
