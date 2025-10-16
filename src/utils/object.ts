export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function getAtPath<T = unknown>(
  target: unknown,
  path: string[],
): T | undefined {
  if (!path.length) return target as T | undefined;
  let current: unknown = target;
  for (const key of path) {
    if (!isPlainObject(current) && !Array.isArray(current)) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(key);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[key];
      if (current === undefined) {
        return undefined;
      }
    }
  }
  return current as T;
}

export function setAtPath(
  target: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  if (!path.length) {
    throw new Error("Path must contain at least one segment");
  }

  let current: Record<string, unknown> | unknown[] = target;

  path.forEach((segment, index) => {
    const isLast = index === path.length - 1;

    if (Array.isArray(current)) {
      const idx = Number(segment);
      if (Number.isNaN(idx)) {
        throw new Error(`Invalid array index segment "${segment}"`);
      }

      if (isLast) {
        current[idx] = value;
        return;
      }

      if (!current[idx]) {
        const nextSegment = path[index + 1];
        current[idx] = Number.isInteger(Number(nextSegment)) ? [] : {};
      }

      current = current[idx] as Record<string, unknown> | unknown[];
      return;
    }

    if (isLast) {
      current[segment] = value;
      return;
    }

    if (!current[segment]) {
      const nextSegment = path[index + 1];
      current[segment] = Number.isInteger(Number(nextSegment)) ? [] : {};
    }

    current = current[segment] as Record<string, unknown> | unknown[];
  });
}

export function unsetAtPath(
  target: Record<string, unknown>,
  path: string[],
): void {
  if (!path.length) return;

  const stack: Array<[Record<string, unknown> | unknown[], string | number]> =
    [];
  let current: Record<string, unknown> | unknown[] = target;

  for (let i = 0; i < path.length; i += 1) {
    const segment = path[i];
    const isLast = i === path.length - 1;

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return;
      }

      if (isLast) {
        current.splice(index, 1);
        break;
      }

      stack.push([current, index]);
      current = current[index] as Record<string, unknown> | unknown[];
    } else {
      if (!(segment in current)) {
        return;
      }

      if (isLast) {
        delete current[segment];
        break;
      }

      stack.push([current, segment]);
      current = current[segment] as Record<string, unknown> | unknown[];
    }
  }

  // Clean up any empty containers created by deletion
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const [container, key] = stack[i];
    if (Array.isArray(container)) {
      const index = key as number;
      const value = container[index];
      if (
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (isPlainObject(value) && !Object.keys(value).length)
      ) {
        container.splice(index, 1);
      }
    } else {
      const prop = key as string;
      const value = container[prop];
      if (
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (isPlainObject(value) && !Object.keys(value).length)
      ) {
        delete container[prop];
      }
    }
  }
}

export function hasAtPath(target: unknown, path: string[]): boolean {
  return getAtPath(target, path) !== undefined;
}

export function mergeDeep<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) {
    return deepClone(base);
  }

  if (Array.isArray(base) && Array.isArray(override)) {
    return deepClone(override) as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = {};
    const keys = new Set([
      ...Object.keys(base as Record<string, unknown>),
      ...Object.keys(override as Record<string, unknown>),
    ]);

    keys.forEach((key) => {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = (override as Record<string, unknown>)[key];

      if (overrideValue === undefined) {
        result[key] = deepClone(baseValue);
      } else if (baseValue === undefined) {
        result[key] = deepClone(overrideValue);
      } else {
        result[key] = mergeDeep(baseValue, overrideValue);
      }
    });

    return result as T;
  }

  return deepClone(override) as T;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

export function toPathString(path: string[]): string {
  return path.join(".");
}
