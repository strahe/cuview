export interface ConfigLayerResponse {
  [key: string]: unknown;
}

export interface ConfigTopologyEntry {
  ID?: string | number;
  id?: string | number;
  Name?: string;
  name?: string;
  Server?: string;
  server?: string;
  LayersCSV?: string;
  layersCSV?: string;
  layers_csv?: string;
  CPU?: string | number;
  Cpu?: string | number;
  cpu?: string | number;
  GPU?: string | number;
  Gpu?: string | number;
  gpu?: string | number;
  RAM?: string | number;
  Ram?: string | number;
  ram?: string | number;
  TasksCSV?: string;
  tasks_csv?: string;
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

export interface ConfigSchemaDocument extends ConfigSchemaNode {
  properties?: Record<string, ConfigSchemaNode>;
  definitions?: Record<string, ConfigSchemaNode>;
  $defs?: Record<string, ConfigSchemaNode>;
  $ref?: string;
}
