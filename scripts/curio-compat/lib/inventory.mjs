import { readFileSync } from "node:fs";

const RESPONSE_KINDS = new Set(["fields", "scalar", "map", "opaque", "none"]);

export function loadInventory(filePath) {
  const inventory = JSON.parse(readFileSync(filePath, "utf8"));
  return validateInventory(inventory);
}

export function validateInventory(inventory) {
  if (!inventory || typeof inventory !== "object") {
    throw new Error("Inventory must be an object");
  }

  const normalized = {
    manualReview: inventory.manualReview ?? [],
    rest: inventory.rest ?? [],
    rpc: inventory.rpc ?? [],
  };

  if (!Array.isArray(normalized.rpc)) throw new Error("rpc must be an array");
  if (!Array.isArray(normalized.rest)) throw new Error("rest must be an array");
  if (!Array.isArray(normalized.manualReview)) {
    throw new Error("manualReview must be an array");
  }

  validateRpcEntries(normalized.rpc);
  validateRestEntries(normalized.rest);
  validateManualReview(normalized.manualReview);
  return normalized;
}

function validateRpcEntries(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object")
      throw new Error("RPC entry is invalid");
    if (!nonEmptyString(entry.method))
      throw new Error("RPC method is required");
    if (seen.has(entry.method))
      throw new Error(`Duplicate RPC entry: ${entry.method}`);
    seen.add(entry.method);
    validateParams(entry);
    validateResponse(entry.response, entry.method);
    validateLocations(entry.locations, entry.method);
  }
}

function validateRestEntries(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object")
      throw new Error("REST entry is invalid");
    if (!nonEmptyString(entry.method))
      throw new Error("REST method is required");
    if (!nonEmptyString(entry.path)) throw new Error("REST path is required");
    const key = `${entry.method} ${entry.path}`;
    if (seen.has(key)) throw new Error(`Duplicate REST entry: ${key}`);
    seen.add(key);
    validateLocations(entry.locations, key);
  }
}

function validateManualReview(entries) {
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Manual review entry is invalid");
    }
    if (entry.type !== "dynamic-rpc" && entry.type !== "dynamic-rest") {
      throw new Error("Manual review type must be dynamic-rpc or dynamic-rest");
    }
    if (!nonEmptyString(entry.location)) {
      throw new Error("Manual review location is required");
    }
    if (!nonEmptyString(entry.reason)) {
      throw new Error("Manual review reason is required");
    }
  }
}

function validateParams(entry) {
  if (entry.params === "dynamic") return;
  if (Number.isInteger(entry.params) && entry.params >= 0) return;
  throw new Error(
    `RPC params must be a non-negative number or dynamic: ${entry.method}`,
  );
}

function validateResponse(response, method) {
  if (!response || typeof response !== "object") {
    throw new Error(`RPC response policy is required: ${method}`);
  }
  if (!RESPONSE_KINDS.has(response.kind)) {
    throw new Error(`RPC response kind is invalid: ${method}`);
  }
  if (response.kind === "fields") {
    if (!Array.isArray(response.fields) || response.fields.length === 0) {
      throw new Error(`RPC response fields must not be empty: ${method}`);
    }
    for (const field of response.fields) {
      if (!nonEmptyString(field)) {
        throw new Error(`RPC response fields must be strings: ${method}`);
      }
    }
  }
  if (response.kind === "opaque" && !nonEmptyString(response.reason)) {
    throw new Error(`RPC opaque response reason is required: ${method}`);
  }
}

function validateLocations(locations, owner) {
  if (locations === undefined) return;
  if (!Array.isArray(locations))
    throw new Error(`locations must be an array: ${owner}`);
  for (const location of locations) {
    if (!nonEmptyString(location))
      throw new Error(`location must be a string: ${owner}`);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
