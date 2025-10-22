import { getAtPath, hasAtPath, mergeDeep, toPathString } from "@/utils/object";
import type {
  ConfigArrayItemProperty,
  ConfigFieldOption,
  ConfigFieldRow,
  ConfigFieldType,
  ConfigSchemaDocument,
  ConfigSchemaNode,
} from "@/types/config";

const UPPERCASE_PATTERN = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUMERIC_PATTERN = /[_\s]+/g;

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolvePointer(
  document: ConfigSchemaDocument,
  pointer: string,
): ConfigSchemaNode | undefined {
  if (!pointer.startsWith("#/")) return undefined;

  const segments = pointer
    .slice(2)
    .split("/")
    .map((segment) => decodePointerSegment(segment));

  let current: unknown = document;

  for (const segment of segments) {
    if (!segment.length) continue;
    if (
      current === null ||
      typeof current !== "object" ||
      !(segment in (current as Record<string, unknown>))
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current as ConfigSchemaNode | undefined;
}

function mergeSchemaNodes(
  base: ConfigSchemaNode | undefined,
  override: ConfigSchemaNode | undefined,
): ConfigSchemaNode | undefined {
  if (!base && !override) return undefined;

  const result: ConfigSchemaNode = {};

  const assign = (source?: ConfigSchemaNode) => {
    if (!source) return;
    if (source.title !== undefined) result.title = source.title;
    if (source.description !== undefined)
      result.description = source.description;
    if (source.type !== undefined) result.type = source.type;
    if (source.properties !== undefined) result.properties = source.properties;
    if (source.items !== undefined) result.items = source.items;
    if (source.enum !== undefined) result.enum = source.enum;
    if (source.default !== undefined) result.default = source.default;
    if (source.examples !== undefined) result.examples = source.examples;
    if (source.format !== undefined) result.format = source.format;
    if (source.minimum !== undefined) result.minimum = source.minimum;
    if (source.maximum !== undefined) result.maximum = source.maximum;
    if (source.minItems !== undefined) result.minItems = source.minItems;
    if (source.maxItems !== undefined) result.maxItems = source.maxItems;
    if (source.pattern !== undefined) result.pattern = source.pattern;
    if (source.required !== undefined) result.required = source.required;
    if (source.allOf !== undefined) result.allOf = source.allOf;
    if (source.anyOf !== undefined) result.anyOf = source.anyOf;
    if (source.oneOf !== undefined) result.oneOf = source.oneOf;
    if (source.options !== undefined) result.options = source.options;
  };

  assign(base);
  assign(override);

  if (!result.type && result.properties) {
    result.type = "object";
  }

  return result;
}

function resolveSchemaNode(
  document: ConfigSchemaDocument | null,
  node?: ConfigSchemaNode,
  visited: Set<string> = new Set(),
): ConfigSchemaNode | undefined {
  if (!node) return undefined;
  let resolved: ConfigSchemaNode | undefined = mergeSchemaNodes(
    undefined,
    node,
  );

  if (node.$ref && document) {
    const ref = node.$ref;
    if (!visited.has(ref)) {
      visited.add(ref);
      const target = resolvePointer(document, ref);
      const resolvedTarget = resolveSchemaNode(
        document,
        target,
        new Set(visited),
      );
      resolved = mergeSchemaNodes(resolvedTarget, {
        ...resolved,
        $ref: undefined,
      });
    }
  }

  const combinationKeys: Array<"allOf" | "anyOf" | "oneOf"> = [
    "allOf",
    "anyOf",
    "oneOf",
  ];

  combinationKeys.forEach((key) => {
    const entries = resolved?.[key];
    if (!entries || !entries.length) return;

    let combined = mergeSchemaNodes(undefined, {
      ...resolved,
      [key]: undefined,
    });
    entries.forEach((entry) => {
      combined = mergeSchemaNodes(
        combined,
        resolveSchemaNode(document, entry, new Set(visited)),
      );
    });
    resolved = combined;
  });

  if (resolved?.items) {
    resolved = {
      ...resolved,
      items: resolveSchemaNode(document, resolved.items, new Set(visited)),
    };
  }

  if (!resolved?.type && resolved?.enum) {
    const enumType = typeof resolved.enum[0];
    if (
      enumType === "string" ||
      enumType === "number" ||
      enumType === "boolean"
    ) {
      resolved.type = enumType;
    }
  }

  return resolved;
}

function formatLabel(key: string): string {
  const spaced = key
    .replace(UPPERCASE_PATTERN, "$1 $2")
    .replace(NON_ALPHANUMERIC_PATTERN, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function normalizeType(node: ConfigSchemaNode): ConfigFieldType {
  const rawType = Array.isArray(node.type) ? node.type[0] : node.type;
  if (!rawType) return node.properties ? "object" : "unknown";

  if (
    rawType === "string" ||
    rawType === "number" ||
    rawType === "integer" ||
    rawType === "boolean" ||
    rawType === "array" ||
    rawType === "object"
  ) {
    return rawType;
  }

  return "unknown";
}

interface FlattenContext {
  schema: ConfigSchemaNode;
  path: string[];
  groupKey: string;
  groupLabel: string;
  document: ConfigSchemaDocument | null;
}

function collectRows(
  context: FlattenContext,
  defaultsRoot: Record<string, unknown>,
  overridesRoot: Record<string, unknown>,
  effectiveRoot: Record<string, unknown>,
  rows: ConfigFieldRow[],
) {
  const { schema, path, groupKey, groupLabel, document } = context;
  const resolvedSchema = resolveSchemaNode(document, schema);
  if (!resolvedSchema) {
    return;
  }

  const { properties } = resolvedSchema;
  const nodeType = normalizeType(resolvedSchema);

  const hasNestedProperties =
    properties && Object.keys(properties).length > 0 && nodeType !== "array";

  if (hasNestedProperties) {
    Object.entries(properties as Record<string, ConfigSchemaNode>).forEach(
      ([key, childSchema]) => {
        collectRows(
          {
            schema: childSchema,
            path: [...path, key],
            groupKey,
            groupLabel,
            document,
          },
          defaultsRoot,
          overridesRoot,
          effectiveRoot,
          rows,
        );
      },
    );
    return;
  }

  const id = toPathString(path);
  const label =
    resolvedSchema.title ?? formatLabel(path[path.length - 1] ?? groupLabel);
  const defaultValue =
    getAtPath(defaultsRoot, path) ??
    resolvedSchema.default ??
    getAtPath(effectiveRoot, path);
  const overrideExists = hasAtPath(overridesRoot, path);
  const overrideValue = getAtPath(overridesRoot, path);
  const effectiveValue = getAtPath(effectiveRoot, path);

  const options = resolvedSchema.enum
    ? resolvedSchema.enum.map((value) => ({
        label: String(value),
        value,
      }))
    : undefined;

  const arrayDetails =
    nodeType === "array"
      ? resolveArrayDetails(resolvedSchema, document, schema)
      : undefined;

  const isEditable = nodeType !== "object";

  rows.push({
    id,
    path,
    groupKey,
    groupLabel,
    label,
    description: schema.description,
    helpText: resolvedSchema.options?.infoText,
    type: nodeType,
    defaultValue,
    effectiveValue,
    overrideValue,
    isOverride: overrideExists,
    isArray: nodeType === "array",
    isEditable,
    options,
    arrayItemType: arrayDetails?.itemType,
    arrayItemLabel: arrayDetails?.itemLabel,
    arrayItemOptions: arrayDetails?.itemOptions,
    arrayItemProperties: arrayDetails?.itemProperties,
    minItems: resolvedSchema.minItems,
    maxItems: resolvedSchema.maxItems,
  });
}

function resolveArrayDetails(
  schema: ConfigSchemaNode,
  document: ConfigSchemaDocument | null,
  original?: ConfigSchemaNode,
):
  | {
      itemType?: ConfigFieldType;
      itemLabel?: string;
      itemOptions?: ConfigFieldOption[];
      itemProperties?: ConfigArrayItemProperty[];
    }
  | undefined {
  if (!schema.items || typeof schema.items !== "object") {
    return undefined;
  }

  const rawItemsSchema =
    typeof schema.items === "object"
      ? (schema.items as ConfigSchemaNode)
      : undefined;
  const resolvedItemsSchema = resolveSchemaNode(
    document,
    schema.items as ConfigSchemaNode,
  );
  const itemSchema = resolvedItemsSchema ?? rawItemsSchema;

  if (!itemSchema) {
    return undefined;
  }

  const itemType = normalizeType(itemSchema);
  const originalItems =
    original && typeof original.items === "object"
      ? (original.items as ConfigSchemaNode)
      : undefined;

  const itemLabel =
    itemSchema.title ?? rawItemsSchema?.title ?? originalItems?.title;

  const itemOptions = itemSchema.enum
    ? itemSchema.enum.map((value) => ({
        label: String(value),
        value,
      }))
    : undefined;

  const itemProperties =
    itemType === "object"
      ? buildArrayItemProperties(itemSchema, document)
      : undefined;

  return {
    itemType,
    itemLabel,
    itemOptions,
    itemProperties,
  };
}

function buildArrayItemProperties(
  schema: ConfigSchemaNode,
  document: ConfigSchemaDocument | null,
): ConfigArrayItemProperty[] | undefined {
  if (!schema.properties || !Object.keys(schema.properties).length) {
    return undefined;
  }

  const requiredKeys = new Set(schema.required ?? []);

  return Object.entries(
    schema.properties as Record<string, ConfigSchemaNode>,
  ).map(([key, propertySchema]) => {
    const resolvedProperty =
      resolveSchemaNode(document, propertySchema) ?? propertySchema;
    const propertyType = normalizeType(resolvedProperty);
    const propertyOptions = resolvedProperty.enum
      ? resolvedProperty.enum.map((value) => ({
          label: String(value),
          value,
        }))
      : undefined;

    const arrayDetails =
      propertyType === "array"
        ? resolveArrayDetails(resolvedProperty, document, propertySchema)
        : undefined;

    return {
      key,
      label: resolvedProperty.title ?? formatLabel(key),
      description: resolvedProperty.description,
      helpText: resolvedProperty.options?.infoText,
      type: propertyType,
      required: requiredKeys.has(key),
      options: propertyOptions,
      defaultValue: resolvedProperty.default,
      arrayItemType: arrayDetails?.itemType,
      arrayItemLabel: arrayDetails?.itemLabel,
      arrayItemOptions: arrayDetails?.itemOptions,
      arrayItemProperties: arrayDetails?.itemProperties,
      minItems: resolvedProperty.minItems,
      maxItems: resolvedProperty.maxItems,
    };
  });
}

function resolveRootProperties(
  schema: ConfigSchemaDocument | null,
): Record<string, ConfigSchemaNode> | undefined {
  if (!schema) return undefined;

  if (schema.properties && Object.keys(schema.properties).length) {
    return schema.properties;
  }

  if (schema.$ref) {
    const resolved = resolveSchemaNode(schema, { $ref: schema.$ref });
    if (resolved?.properties && Object.keys(resolved.properties).length) {
      return resolved.properties;
    }
  }

  const definitions = schema.$defs ?? schema.definitions;
  if (definitions) {
    const entryWithProps = Object.values(definitions).find(
      (entry) => entry?.properties && Object.keys(entry.properties).length,
    );
    if (entryWithProps?.properties) {
      return entryWithProps.properties;
    }
  }

  if (schema.definitions && Object.values(schema.definitions).length) {
    const entry = Object.values(schema.definitions).find(
      (item) => item?.properties && Object.keys(item.properties).length,
    );
    if (entry?.properties) {
      return entry.properties;
    }
  }

  return undefined;
}

export function buildConfigFieldRows(
  schema: ConfigSchemaDocument | null,
  defaults: Record<string, unknown> | null,
  overrides: Record<string, unknown>,
): ConfigFieldRow[] {
  const rootProperties = resolveRootProperties(schema);

  if (!schema || !rootProperties) {
    return [];
  }

  const defaultsRoot = (defaults ?? {}) as Record<string, unknown>;
  const overridesRoot = (overrides ?? {}) as Record<string, unknown>;
  const effectiveRoot = mergeDeep(defaultsRoot, overridesRoot) as Record<
    string,
    unknown
  >;

  const rows: ConfigFieldRow[] = [];

  Object.entries(rootProperties).forEach(([groupKey, groupSchema]) => {
    const resolvedGroupSchema = resolveSchemaNode(schema, groupSchema);
    const groupLabel =
      resolvedGroupSchema?.title ?? groupSchema.title ?? formatLabel(groupKey);
    collectRows(
      {
        schema: groupSchema,
        path: [groupKey],
        groupKey,
        groupLabel,
        document: schema,
      },
      defaultsRoot,
      overridesRoot,
      effectiveRoot,
      rows,
    );
  });

  return rows;
}

export function groupFieldRows(
  rows: ConfigFieldRow[],
): Map<string, ConfigFieldRow[]> {
  const grouped = new Map<string, ConfigFieldRow[]>();
  rows.forEach((row) => {
    const key = row.groupKey;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(row);
  });
  return grouped;
}
