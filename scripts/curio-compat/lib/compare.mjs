export function compareTargetGate({ inventory, target }) {
  const blockers = [];
  const manualReview = [...inventory.manualReview];

  for (const entry of inventory.rpc) {
    compareRpcEntry(entry, target, blockers, manualReview);
  }
  for (const entry of inventory.rest) {
    compareRestEntry(entry, target, blockers);
  }

  const dedupedBlockers = dedupeItems(blockers);
  return {
    blockers: dedupedBlockers,
    exitCode: dedupedBlockers.length > 0 ? 1 : 0,
    manualReview: dedupeItems(manualReview),
  };
}

export function diffAddedInterfaces({ from, to }) {
  const fromMethods = from.rpcMethods ?? {};
  const toMethods = to.rpcMethods ?? {};
  const fromRoutes = new Set(
    (from.restRoutes ?? []).map((route) => restKey(route)),
  );

  return {
    rest: (to.restRoutes ?? [])
      .filter((route) => !fromRoutes.has(restKey(route)))
      .map((route) => ({ method: route.method, path: route.path }))
      .sort(compareRest),
    rpc: Object.keys(toMethods)
      .filter((method) => !fromMethods[method])
      .sort()
      .map((method) => ({
        method,
        params: toMethods[method].params?.length ?? 0,
      })),
  };
}

function compareRpcEntry(entry, target, blockers, manualReview) {
  const method = target.rpcMethods?.[entry.method];
  if (!method) {
    blockers.push(
      withLocation(entry, { method: entry.method, type: "missing-rpc" }),
    );
    return;
  }

  if (entry.params === "dynamic") {
    manualReview.push(
      withLocation(entry, {
        method: entry.method,
        type: "rpc-params-dynamic",
      }),
    );
  } else {
    const expected = method.params?.length ?? 0;
    if (entry.params !== expected) {
      blockers.push(
        withLocation(entry, {
          actual: entry.params,
          expected,
          method: entry.method,
          type: "rpc-param-count",
        }),
      );
    }
  }

  compareResponse(entry, method, blockers, manualReview);
}

function compareResponse(entry, method, blockers, manualReview) {
  const response = entry.response;
  if (response.kind === "opaque") {
    manualReview.push(
      withLocation(entry, {
        method: entry.method,
        reason: response.reason,
        type: "opaque-rpc-response",
      }),
    );
    return;
  }
  if (response.kind !== "fields") return;
  if (!Array.isArray(method.fields)) {
    blockers.push(
      withLocation(entry, {
        method: entry.method,
        type: "rpc-response-fields-unresolved",
      }),
    );
    return;
  }

  const targetFields = new Set(method.fields);
  for (const field of response.fields) {
    if (targetFields.has(field)) continue;
    blockers.push(
      withLocation(entry, {
        field,
        method: entry.method,
        targetFields: [...targetFields].sort(),
        type: "rpc-response-field",
      }),
    );
  }
}

function compareRestEntry(entry, target, blockers) {
  const matches = (target.restRoutes ?? []).some((route) =>
    restRouteMatches(route, entry),
  );
  if (matches) return;
  blockers.push(
    withLocation(entry, {
      method: entry.method,
      path: entry.path,
      type: "missing-rest",
    }),
  );
}

function restRouteMatches(route, entry) {
  if (route.method !== entry.method && route.method !== "*") return false;
  return pathsCompatible(normalizePath(route.path), normalizePath(entry.path));
}

function pathsCompatible(routePath, callPath) {
  if (routePath === callPath) return true;
  const routeSegments = routePath.split("/").filter(Boolean);
  const callSegments = callPath.split("/").filter(Boolean);
  if (routeSegments.length !== callSegments.length) return false;
  return routeSegments.every(
    (segment, index) =>
      segment === callSegments[index] || /^\{[^}]+\}$/.test(segment),
  );
}

function normalizePath(value) {
  return (
    String(value ?? "")
      .split("?")[0]
      .replace(/\/+$/, "") || "/"
  );
}

function restKey(route) {
  return `${route.method} ${normalizePath(route.path)}`;
}

function compareRest(left, right) {
  return restKey(left).localeCompare(restKey(right));
}

function withLocation(entry, item) {
  const location = entry.locations?.[0];
  if (!location) return item;
  const match = location.match(/^(.+):(\d+)$/);
  if (!match) return { ...item, location };
  return { ...item, file: match[1], line: Number(match[2]) };
}

function dedupeItems(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
