import type { LocationQueryRaw } from "vue-router";

export type IpniQueryKey = "ad" | "entry";

export const normalizeQueryString = (value: unknown): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
};

export const mergeCidQuery = (
  base: LocationQueryRaw,
  key: IpniQueryKey,
  value: string,
): LocationQueryRaw => {
  const query = { ...base };
  const trimmed = value.trim();

  if (trimmed.length) {
    query[key] = trimmed;
  } else {
    delete query[key];
  }

  return query;
};
