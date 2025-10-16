import { getAtPath, hasAtPath, mergeDeep, toPathString } from "@/utils/object";
import type {
  ConfigFieldRow,
  ConfigSchemaDocument,
  ConfigSchemaNode,
  ConfigFieldType,
} from "@/types/config";

const UPPERCASE_PATTERN = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUMERIC_PATTERN = /[_\s]+/g;

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
}

function collectRows(
  context: FlattenContext,
  defaultsRoot: Record<string, unknown>,
  overridesRoot: Record<string, unknown>,
  effectiveRoot: Record<string, unknown>,
  rows: ConfigFieldRow[],
) {
  const { schema, path, groupKey, groupLabel } = context;
  const { properties } = schema;
  const nodeType = normalizeType(schema);

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
    schema.title ?? formatLabel(path[path.length - 1] ?? groupLabel);
  const defaultValue =
    getAtPath(defaultsRoot, path) ??
    schema.default ??
    getAtPath(effectiveRoot, path);
  const overrideExists = hasAtPath(overridesRoot, path);
  const overrideValue = getAtPath(overridesRoot, path);
  const effectiveValue = getAtPath(effectiveRoot, path);

  const options = schema.enum
    ? schema.enum.map((value) => ({
        label: String(value),
        value,
      }))
    : undefined;

  const arrayItemsType =
    schema.items && typeof schema.items === "object"
      ? normalizeType(schema.items)
      : undefined;

  const isEditable =
    nodeType !== "object" &&
    !(
      nodeType === "array" &&
      arrayItemsType === "object" &&
      schema.items?.properties
    );

  rows.push({
    id,
    path,
    groupKey,
    groupLabel,
    label,
    description: schema.description,
    type: nodeType,
    defaultValue,
    effectiveValue,
    overrideValue,
    isOverride: overrideExists,
    isArray: nodeType === "array",
    isEditable,
    options,
  });
}

export function buildConfigFieldRows(
  schema: ConfigSchemaDocument | null,
  defaults: Record<string, unknown> | null,
  overrides: Record<string, unknown>,
): ConfigFieldRow[] {
  if (!schema?.properties) {
    return [];
  }

  const defaultsRoot = (defaults ?? {}) as Record<string, unknown>;
  const overridesRoot = (overrides ?? {}) as Record<string, unknown>;
  const effectiveRoot = mergeDeep(defaultsRoot, overridesRoot) as Record<
    string,
    unknown
  >;

  const rows: ConfigFieldRow[] = [];

  Object.entries(schema.properties).forEach(([groupKey, groupSchema]) => {
    const groupLabel = groupSchema.title ?? formatLabel(groupKey);
    collectRows(
      {
        schema: groupSchema,
        path: [groupKey],
        groupKey,
        groupLabel,
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
