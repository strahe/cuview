import type { FormKitSchemaNode } from "@formkit/core";

// Base JSON Schema types
export interface JSONSchemaProperty {
  type: string;
  pattern?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  additionalProperties?: boolean;
  options?: {
    infoText?: string;
  };
  $ref?: string;
}

export interface JSONSchemaDef {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  additionalProperties?: boolean;
}

export interface JSONSchema {
  $schema: string;
  $id: string;
  $ref: string;
  $defs: Record<string, JSONSchemaDef>;
}

// FormKit schema types
export interface FormKitConfigSection {
  $el: string;
  attrs?: Record<string, unknown>;
  children?: FormKitSchemaNode[];
  meta?: {
    title: string;
    description?: string;
    collapsible?: boolean;
    collapsed?: boolean;
  };
}

export interface FormKitFieldDefinition {
  type: string;
  name: string;
  label?: string;
  help?: string;
  placeholder?: string;
  validation?: string;
  disabled?: boolean;
  if?: string;
  options?: Array<{ label: string; value: unknown }>;
  children?: FormKitFieldDefinition[];
}

// Config layer management types
export interface ConfigLayerSummary {
  name: string;
  title?: string;
  description?: string;
  createdAt?: string;
  modifiedAt?: string;
  fieldCount?: number;
}

export interface ConfigFieldState {
  enabled: boolean;
  value: unknown;
  path: string;
  label: string;
  type: string;
  required?: boolean;
  validation?: string[];
  description?: string;
}

export interface ConfigSectionState {
  name: string;
  title: string;
  description?: string;
  collapsed: boolean;
  fields: Record<string, ConfigFieldState>;
}

export interface ConfigEditorState {
  layerName: string;
  sections: Record<string, ConfigSectionState>;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Custom input types
export interface FILAmountConfig {
  type: "fil-amount";
  suffix: "fil" | "attofil";
  min?: string;
  max?: string;
  precision?: number;
}

export interface DurationConfig {
  type: "duration";
  format: "toml" | "seconds" | "minutes" | "hours";
  min?: string;
  max?: string;
  units?: Array<{ label: string; value: string }>;
}

export interface AddressListConfig {
  type: "address-list";
  maxItems?: number;
  validation?: "ethereum" | "filecoin" | "custom";
  placeholder?: string;
}

// Config validation types
export interface ConfigValidationError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationError[];
}

// Config diff types
export interface ConfigFieldDiff {
  field: string;
  type: "added" | "removed" | "modified";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface ConfigLayerDiff {
  layerName: string;
  changes: ConfigFieldDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

// API request/response types
export interface CreateConfigLayerRequest {
  name: string;
  title?: string;
  description?: string;
  copyFrom?: string;
}

export interface UpdateConfigLayerRequest {
  config: Record<string, unknown>;
  comment?: string;
}

export interface ConfigLayerHistoryEntry {
  timestamp: string;
  comment?: string;
  changes: ConfigFieldDiff[];
}

// UI state types
export interface ConfigEditorUIState {
  activeSection?: string;
  searchQuery: string;
  showOnlyEnabled: boolean;
  showAdvanced: boolean;
  previewMode: boolean;
  compactMode: boolean;
}