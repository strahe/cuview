const DEFAULT_CLIENT_ERROR_MESSAGE = "Unexpected error";

export const getErrorMessage = (
  error: unknown,
  fallback = DEFAULT_CLIENT_ERROR_MESSAGE,
): string => {
  if (error instanceof Error) {
    return error.message.trim() || fallback;
  }

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return String(error);
  }

  return fallback;
};

export const getClientErrorLogArgs = (
  error: unknown,
  details?: unknown,
  includeDetails = import.meta.env.DEV,
): readonly unknown[] => {
  if (!includeDetails) {
    return [DEFAULT_CLIENT_ERROR_MESSAGE];
  }

  return details === undefined ? [error] : [error, details];
};

export const logClientError = (
  label: string,
  error: unknown,
  details?: unknown,
): void => {
  console.error(label, ...getClientErrorLogArgs(error, details));
};
