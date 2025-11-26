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
