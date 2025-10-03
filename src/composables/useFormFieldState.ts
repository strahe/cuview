type UnknownRecord = Record<string, unknown> | null | undefined;

type NormalizedErrors = string[];

type ExtendedMeta = {
  isValid?: boolean;
  isTouched?: boolean;
  isDirty?: boolean;
  isSubmitted?: boolean;
  errors?: unknown;
};

const normalizeMessage = (entry: unknown): string => {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "number" || typeof entry === "boolean") {
    return entry.toString();
  }
  if (Array.isArray(entry)) {
    return entry
      .map((item) => normalizeMessage(item))
      .filter(Boolean)
      .join(", ");
  }
  return Object.values(entry as Record<string, unknown>)
    .map((value) => normalizeMessage(value))
    .filter(Boolean)
    .join(", ");
};

const toExtendedMeta = (meta: UnknownRecord): ExtendedMeta | null => {
  if (!meta) return null;
  return meta as ExtendedMeta;
};

export const useFormFieldState = () => {
  const shouldShowErrors = (meta: UnknownRecord): boolean => {
    const typed = toExtendedMeta(meta);
    if (!typed) return false;
    return (
      typed.isValid === false &&
      Boolean(typed.isTouched || typed.isDirty || typed.isSubmitted)
    );
  };

  const extractErrors = (meta: UnknownRecord): NormalizedErrors => {
    const typed = toExtendedMeta(meta);
    if (!typed || !typed.errors) return [];

    const list = Array.isArray(typed.errors) ? typed.errors : [typed.errors];

    return list
      .map((entry) => normalizeMessage(entry))
      .filter((message): message is string =>
        Boolean(message && message.length),
      );
  };

  return {
    shouldShowErrors,
    extractErrors,
  };
};

export type UseFormFieldStateReturn = ReturnType<typeof useFormFieldState>;
