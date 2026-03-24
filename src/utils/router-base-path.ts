export function getRouterBasePath(baseUrl: string | undefined): string {
  if (!baseUrl || !baseUrl.startsWith("/")) {
    return "/";
  }

  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function getViteBasePath(basePath: string | undefined): string {
  const normalized = getRouterBasePath(basePath);
  return normalized === "/" ? "/" : `${normalized}/`;
}
