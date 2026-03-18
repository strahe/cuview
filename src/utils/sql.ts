import type {
  SqlNullableBool,
  SqlNullableNumber,
  SqlNullableString,
  SqlNullableTime,
} from "@/types/sql";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const unwrapSqlNullableString = (
  value: SqlNullableString | string | null | undefined,
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (isObject(value) && "Valid" in value) {
    const candidate = value as SqlNullableString;
    return candidate.Valid ? (candidate.String ?? null) : null;
  }
  return null;
};

export const unwrapSqlNullableNumber = (
  value: SqlNullableNumber | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (isObject(value) && "Valid" in value) {
    const candidate = value as SqlNullableNumber;
    return candidate.Valid ? (candidate.Int64 ?? null) : null;
  }
  return null;
};

export const unwrapSqlNullableBool = (
  value: SqlNullableBool | boolean | null | undefined,
): boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (isObject(value) && "Valid" in value) {
    const candidate = value as SqlNullableBool;
    return candidate.Valid ? (candidate.Bool ?? null) : null;
  }
  return null;
};

export const unwrapSqlNullableTime = (
  value: SqlNullableTime | string | null | undefined,
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (isObject(value) && "Valid" in value) {
    const candidate = value as SqlNullableTime;
    return candidate.Valid ? (candidate.Time ?? null) : null;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Generic nullable extraction (stringified output)
// ---------------------------------------------------------------------------

type SqlNullable =
  | SqlNullableString
  | SqlNullableNumber
  | SqlNullableBool
  | SqlNullableTime;

/**
 * Extract the underlying value from a Go `sql.Null*`-shaped JSON object.
 * Returns `null` when the wrapper is absent, `Valid` is false, or the value
 * itself is nullish.  Primitives pass through as-is.
 */
export function extractNullable(
  val:
    | SqlNullable
    | { Valid: boolean; [key: string]: unknown }
    | string
    | number
    | boolean
    | null
    | undefined,
): string | null {
  if (val == null) return null;
  if (typeof val !== "object") return String(val);
  if (!val.Valid) return null;
  if ("String" in val) return (val as SqlNullableString).String;
  if ("Int64" in val) return String((val as SqlNullableNumber).Int64);
  if ("Bool" in val) return String((val as SqlNullableBool).Bool);
  if ("Time" in val) return (val as SqlNullableTime).Time;
  // Fallback for unknown SqlNullable-shaped objects
  const keys = Object.keys(val).filter((k) => k !== "Valid");
  return keys.length > 0 ? String(val[keys[0]!]) : null;
}
