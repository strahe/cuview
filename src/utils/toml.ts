import { isPlainObject } from "@/utils/object";

function formatString(value: string): string {
  // Escape backslashes and double quotes
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === "string") {
    return formatString(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : '"NaN"';
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Date) {
    return formatString(value.toISOString());
  }

  return formatString(String(value));
}

function formatArray(values: unknown[]): string {
  if (!values.length) return "[]";

  const items = values
    .map((item) => {
      if (Array.isArray(item)) {
        return formatArray(item);
      }
      if (isPlainObject(item)) {
        return formatString(JSON.stringify(item));
      }
      return formatPrimitive(item);
    })
    .join(", ");

  return `[${items}]`;
}

interface SerializeOptions {
  skipHeader?: boolean;
}

function serializeObject(
  obj: Record<string, unknown>,
  path: string[],
  lines: string[],
  options: SerializeOptions = {},
): void {
  const primitiveEntries: Array<[string, unknown]> = [];
  const objectEntries: Array<[string, Record<string, unknown>]> = [];
  const arrayObjectEntries: Array<[string, Record<string, unknown>[]]> = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      const arrayHasObjects = value.every((item) => isPlainObject(item));
      if (arrayHasObjects) {
        arrayObjectEntries.push([key, value as Record<string, unknown>[]]);
      } else {
        primitiveEntries.push([key, value]);
      }
      return;
    }

    if (isPlainObject(value)) {
      objectEntries.push([key, value]);
      return;
    }

    primitiveEntries.push([key, value]);
  });

  const hasHeader = path.length && !options.skipHeader;
  if (hasHeader) {
    lines.push(`[${path.join(".")}]`);
  }

  primitiveEntries.forEach(([key, value]) => {
    const formatted =
      Array.isArray(value) && value.every((item) => !isPlainObject(item))
        ? formatArray(value)
        : formatPrimitive(value);
    lines.push(`${key} = ${formatted}`);
  });

  objectEntries.forEach(([key, value]) => {
    if (lines.length && lines[lines.length - 1] !== "") {
      lines.push("");
    }
    serializeObject(value, [...path, key], lines);
  });

  arrayObjectEntries.forEach(([key, array]) => {
    array.forEach((item) => {
      if (lines.length && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      lines.push(`[[${[...path, key].join(".")}]]`);
      serializeObject(item, [...path, key], lines, { skipHeader: true });
    });
  });
}

export function serializeToml(
  input: Record<string, unknown> | null | undefined,
): string {
  if (!input || !isPlainObject(input)) {
    return "";
  }

  const lines: string[] = [];
  serializeObject(input, [], lines, { skipHeader: true });
  return lines.join("\n");
}
