import { isProxy, toRaw } from "vue";

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
  return cloneInternal(value, new WeakMap()) as T;
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
    if (segment === undefined) {
      return;
    }
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
    const entry = stack[i];
    if (!entry) {
      continue;
    }
    const [container, key] = entry;
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

function cloneInternal(value: unknown, cache: WeakMap<object, unknown>) {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const rawValue = isProxy(value) ? toRaw(value) : value;
  if (typeof rawValue !== "object" || rawValue === null) {
    return rawValue;
  }

  if (cache.has(rawValue as object)) {
    return cache.get(rawValue as object);
  }

  if (rawValue instanceof Date) {
    return new Date(rawValue.getTime());
  }

  if (rawValue instanceof RegExp) {
    return new RegExp(rawValue.source, rawValue.flags);
  }

  if (rawValue instanceof Map) {
    const mapClone = new Map();
    cache.set(rawValue, mapClone);
    rawValue.forEach((mapValue, mapKey) => {
      mapClone.set(
        cloneInternal(mapKey, cache),
        cloneInternal(mapValue, cache),
      );
    });
    return mapClone;
  }

  if (rawValue instanceof Set) {
    const setClone = new Set();
    cache.set(rawValue, setClone);
    rawValue.forEach((setValue) => {
      setClone.add(cloneInternal(setValue, cache));
    });
    return setClone;
  }

  if (Array.isArray(rawValue)) {
    const arrayClone: unknown[] = [];
    cache.set(rawValue, arrayClone);
    rawValue.forEach((item, index) => {
      arrayClone[index] = cloneInternal(item, cache);
    });
    return arrayClone;
  }

  if (rawValue instanceof ArrayBuffer) {
    return rawValue.slice(0);
  }

  if (ArrayBuffer.isView(rawValue)) {
    const view = rawValue as ArrayBufferView & {
      slice?: (start?: number, end?: number) => ArrayBufferView;
    };

    if (typeof view.slice === "function") {
      return view.slice(0) as typeof rawValue;
    }

    return new (view.constructor as {
      new (
        buffer: ArrayBufferLike,
        byteOffset?: number,
        length?: number,
      ): typeof view;
    })(
      view.buffer.slice(0),
      view.byteOffset,
      view instanceof DataView ? view.byteLength : undefined,
    );
  }

  const objectClone: Record<string | number | symbol, unknown> = {};
  const source = rawValue as Record<string | number | symbol, unknown>;
  cache.set(rawValue as object, objectClone);

  Reflect.ownKeys(rawValue as object).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(rawValue as object, key);
    if (!descriptor || !descriptor.enumerable) {
      return;
    }

    objectClone[key as string | number | symbol] = cloneInternal(
      source[key as string | number | symbol],
      cache,
    );
  });

  return objectClone;
}

export function toPathString(path: string[]): string {
  return path.join(".");
}
