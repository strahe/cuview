const DEFAULT_CLIENT_ERROR_MESSAGE = "Unexpected error";

const URL_WITH_AUTH_PATTERN =
  /\b((?:https?|wss?):\/\/)([^/@\s?#]+(?::[^/@\s?#]*)?@)([^\s]+)/gi;
const TOKEN_QUERY_PARAM_PATTERN = /([?&]token=)([^&#\s"'<>]+)/gi;
const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]{7,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

const maskSensitiveData = (message: string): string =>
  message
    .replace(
      URL_WITH_AUTH_PATTERN,
      (_match, scheme: string, _credentials: string, rest: string) =>
        `${scheme}***:***@${rest}`,
    )
    .replace(TOKEN_QUERY_PARAM_PATTERN, "$1***")
    .replace(JWT_PATTERN, "***JWT***");

const getObjectMessage = (error: object): string | undefined => {
  if (!("message" in error)) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
};

export const getErrorMessage = (
  error: unknown,
  fallback = DEFAULT_CLIENT_ERROR_MESSAGE,
): string => {
  let message: string | undefined;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    message = String(error);
  } else if (error !== null && typeof error === "object") {
    message = getObjectMessage(error);
  }

  const trimmed = message?.trim();
  return trimmed ? maskSensitiveData(trimmed) : fallback;
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
