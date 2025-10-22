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
  $ref?: string;
  definitions?: Record<string, ConfigSchemaNode>;
  $defs?: Record<string, ConfigSchemaNode>;
  required?: string[];
  allOf?: ConfigSchemaNode[];
  anyOf?: ConfigSchemaNode[];
  oneOf?: ConfigSchemaNode[];
  options?: {
    infoText?: string;
  };
}

export interface ConfigLayerSummary {
  name: string;
  isDefault: boolean;
  nodeCount: number;
}

export type ConfigLayerMap = Record<string, ConfigLayerResponse>;

export interface ConfigSchemaDocument extends ConfigSchemaNode {
  properties?: Record<string, ConfigSchemaNode>;
  definitions?: Record<string, ConfigSchemaNode>;
  $defs?: Record<string, ConfigSchemaNode>;
  $ref?: string;
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

export interface ConfigArrayItemProperty {
  key: string;
  label: string;
  description?: string;
  helpText?: string;
  type: ConfigFieldType;
  required?: boolean;
  options?: ConfigFieldOption[];
  defaultValue?: unknown;
  arrayItemType?: ConfigFieldType;
  arrayItemLabel?: string;
  arrayItemOptions?: ConfigFieldOption[];
  arrayItemProperties?: ConfigArrayItemProperty[];
  minItems?: number;
  maxItems?: number;
}

export interface ConfigFieldRow {
  id: string;
  path: string[];
  groupKey: string;
  groupLabel: string;
  label: string;
  description?: string;
  helpText?: string;
  type: ConfigFieldType;
  defaultValue: unknown;
  effectiveValue: unknown;
  overrideValue: unknown;
  isOverride: boolean;
  isArray: boolean;
  isEditable: boolean;
  options?: ConfigFieldOption[];
  arrayItemType?: ConfigFieldType;
  arrayItemLabel?: string;
  arrayItemOptions?: ConfigFieldOption[];
  arrayItemProperties?: ConfigArrayItemProperty[];
  minItems?: number;
  maxItems?: number;
}
