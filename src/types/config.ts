export interface ConfigLayerResponse {
  [key: string]: unknown;
}

export interface ConfigTopologyEntry {
  ID?: string | number;
  Name?: string;
  LayersCSV: string;
  [key: string]: unknown;
}

export interface ConfigSchemaNode {
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, ConfigSchemaNode>;
  items?: ConfigSchemaNode;
  enum?: Array<string | number | boolean>;
  default?: unknown;
  examples?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
}

export interface ConfigLayerSummary {
  name: string;
  isDefault: boolean;
  nodeCount: number;
}

export type ConfigLayerMap = Record<string, ConfigLayerResponse>;

export interface ConfigSchemaDocument extends ConfigSchemaNode {
  properties?: Record<string, ConfigSchemaNode>;
}

export type ConfigFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object"
  | "unknown";

export interface ConfigFieldOption<T = string | number | boolean> {
  label: string;
  value: T;
}

export interface ConfigFieldRow {
  id: string;
  path: string[];
  groupKey: string;
  groupLabel: string;
  label: string;
  description?: string;
  type: ConfigFieldType;
  defaultValue: unknown;
  effectiveValue: unknown;
  overrideValue: unknown;
  isOverride: boolean;
  isArray: boolean;
  isEditable: boolean;
  options?: ConfigFieldOption[];
}
