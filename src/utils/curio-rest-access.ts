import { RestClientNetworkError } from "@/lib/rest-client";

export class CurioRestAccessError extends Error {
  constructor(cause: unknown) {
    super("Curio REST blocked.", { cause });
    this.name = "CurioRestAccessError";
  }
}

export const CURIO_REST_CORS_ORIGINS = [
  "https://cuview.strahe.com",
  "http://cuview.strahe.com",
  "http://localhost:5173",
] as const;

function getCurrentHttpOrigin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const origin = window.location?.origin;
  if (
    typeof origin !== "string" ||
    (!origin.startsWith("http://") && !origin.startsWith("https://"))
  ) {
    return null;
  }

  return origin;
}

export function formatCurioCorsOriginsValue(): string {
  const origins = new Set<string>(CURIO_REST_CORS_ORIGINS);
  const currentOrigin = getCurrentHttpOrigin();
  if (currentOrigin) {
    origins.add(currentOrigin);
  }

  return `[${Array.from(origins)
    .map((origin) => JSON.stringify(origin))
    .join(", ")}]`;
}

export function isCurioRestAccessError(error: unknown): boolean {
  return (
    error instanceof CurioRestAccessError ||
    error instanceof RestClientNetworkError
  );
}

export function formatCurioRestAccessMessage(error: unknown): string {
  if (isCurioRestAccessError(error)) {
    return "Curio REST blocked.";
  }

  return error instanceof Error ? error.message : String(error);
}
