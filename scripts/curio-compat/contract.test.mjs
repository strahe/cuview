import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { compareTargetGate, diffAddedInterfaces } from "./lib/compare.mjs";
import {
  collectCoverageIssues,
  collectCurioSourceUsageFromFiles,
} from "./lib/coverage.mjs";
import { loadCurioContract } from "./lib/curio-contract.mjs";
import { validateInventory } from "./lib/inventory.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "../..");

describe("inventory validation", () => {
  test("rejects duplicate entries and invalid response policy", () => {
    expect(() =>
      validateInventory({
        manualReview: [],
        rest: [],
        rpc: [
          {
            method: "ActorSummary",
            params: 0,
            response: { fields: ["Address"], kind: "fields" },
          },
          {
            method: "ActorSummary",
            params: 0,
            response: { fields: ["Address"], kind: "fields" },
          },
        ],
      }),
    ).toThrow(/duplicate RPC/i);

    expect(() =>
      validateInventory({
        manualReview: [],
        rest: [],
        rpc: [
          {
            method: "ActorSummary",
            params: 0,
            response: { fields: [], kind: "fields" },
          },
        ],
      }),
    ).toThrow(/fields/i);

    expect(() =>
      validateInventory({
        manualReview: [],
        rest: [],
        rpc: [
          {
            method: "ActorSummary",
            params: "sometimes",
            response: { kind: "scalar" },
          },
        ],
      }),
    ).toThrow(/params/i);

    expect(() =>
      validateInventory({
        manualReview: [],
        rest: [],
        rpc: [
          {
            method: "ActorSummary",
            params: 0,
            response: { kind: "opaque" },
          },
        ],
      }),
    ).toThrow(/reason/i);
  });
});

describe("source coverage scanner", () => {
  test("reports missing literal usage and unregistered dynamic calls", () => {
    const usage = collectCurioSourceUsageFromFiles([
      {
        content: `
          let client;
          client = createJsonRpcClient({});
          client.call("Version");
          useCurioRpc("ActorSummary", []);
          useCurioRpcMutation(methodName, []);
          restGet("/api/config/default");
          restPost(dynamicPath, {});
        `,
        path: "src/routes/dashboard.tsx",
      },
      {
        content: `useCurioRpc("IgnoredTest", []);`,
        path: "src/routes/dashboard.test.tsx",
      },
      {
        content: `useCurioRpc("IgnoredPlumbing", []);`,
        path: "src/hooks/use-curio-query.ts",
      },
    ]);

    const issues = collectCoverageIssues(
      {
        manualReview: [
          {
            location: "src/routes/dashboard.tsx:6",
            reason: "mutation chooses the method at runtime",
            type: "dynamic-rpc",
          },
        ],
        rest: [],
        rpc: [
          {
            method: "ActorSummary",
            params: 0,
            response: { kind: "scalar" },
          },
        ],
      },
      usage,
    );

    expect(issues).toEqual([
      {
        kind: "direct",
        location: "src/routes/dashboard.tsx:4",
        method: "Version",
        type: "missing-rpc",
      },
      {
        kind: "query",
        location: "src/routes/dashboard.tsx:7",
        method: "GET",
        path: "/api/config/default",
        type: "missing-rest",
      },
      {
        location: "src/routes/dashboard.tsx:8",
        reason: "restPost uses a non-literal path",
        type: "unregistered-dynamic-rest",
      },
    ]);
  });
});

describe("target gate comparison", () => {
  test("blocks missing target contracts and unresolved field responses", () => {
    const inventory = {
      manualReview: [
        {
          location: "src/routes/manual.tsx:10",
          reason: "runtime selected method",
          type: "dynamic-rpc",
        },
      ],
      rest: [{ method: "GET", path: "/api/missing" }],
      rpc: [
        {
          method: "Gone",
          params: 0,
          response: { kind: "none" },
        },
        {
          method: "WrongParams",
          params: 2,
          response: { kind: "scalar" },
        },
        {
          method: "MissingField",
          params: 0,
          response: { fields: ["ID", "Name"], kind: "fields" },
        },
        {
          method: "Unresolved",
          params: 0,
          response: { fields: ["ID"], kind: "fields" },
        },
        {
          method: "Opaque",
          params: "dynamic",
          response: { kind: "opaque", reason: "shape depends on params" },
        },
      ],
    };
    const target = {
      ref: "v2",
      restRoutes: [{ method: "POST", path: "/api/missing" }],
      rpcMethods: {
        MissingField: { fields: ["ID"], params: [] },
        Opaque: { fields: [], params: [{ type: "string" }] },
        Unresolved: { params: [] },
        WrongParams: { fields: [], params: [{ type: "string" }] },
      },
    };

    const result = compareTargetGate({ inventory, target });

    expect(result.exitCode).toBe(1);
    expect(result.blockers).toEqual([
      { method: "Gone", type: "missing-rpc" },
      {
        actual: 2,
        expected: 1,
        method: "WrongParams",
        type: "rpc-param-count",
      },
      {
        field: "Name",
        method: "MissingField",
        targetFields: ["ID"],
        type: "rpc-response-field",
      },
      {
        method: "Unresolved",
        type: "rpc-response-fields-unresolved",
      },
      { method: "GET", path: "/api/missing", type: "missing-rest" },
    ]);
    expect(result.manualReview).toEqual([
      {
        location: "src/routes/manual.tsx:10",
        reason: "runtime selected method",
        type: "dynamic-rpc",
      },
      { method: "Opaque", type: "rpc-params-dynamic" },
      {
        method: "Opaque",
        reason: "shape depends on params",
        type: "opaque-rpc-response",
      },
    ]);
  });

  test("lists Curio interfaces added between from and to without affecting exit code", () => {
    const added = diffAddedInterfaces({
      from: {
        restRoutes: [{ method: "GET", path: "/api/old" }],
        rpcMethods: { Old: { params: [] } },
      },
      to: {
        restRoutes: [
          { method: "GET", path: "/api/old" },
          { method: "POST", path: "/api/new" },
        ],
        rpcMethods: {
          New: { params: [{ type: "string" }] },
          Old: { params: [] },
        },
      },
    });

    expect(added).toEqual({
      rest: [{ method: "POST", path: "/api/new" }],
      rpc: [{ method: "New", params: 1 }],
    });
  });
});

describe("Curio contract extraction", () => {
  test("extracts WebRPC response fields and static REST routes from git refs", () => {
    const repo = createCurioFixtureRepo();

    const contract = loadCurioContract({
      curioRepo: repo,
      ref: "v2",
      repoRoot,
    });

    expect(contract.rpcMethods.Thing).toEqual({
      fields: ["id", "Name"],
      params: [{ type: "string" }],
    });
    expect(contract.rpcMethods.Repeated).toEqual({
      fields: ["Shared", "Left", "Right"],
      params: [],
    });
    expect(contract.rpcMethods.Inline).toEqual({
      fields: ["Shared", "Inline"],
      params: [],
    });
    expect(contract.rpcMethods.Added).toEqual({
      fields: [],
      params: [],
    });
    expect(contract.restRoutes).toContainEqual({
      method: "GET",
      path: "/api/status",
    });
  });
});

function createCurioFixtureRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), "curio-compat-"));
  writeFileSync(
    path.join(repo, "go.mod"),
    "module github.com/filecoin-project/curio\n\ngo 1.24\n",
  );
  writeFixtureFiles(repo, { includeAdded: false });
  git(repo, ["init"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test User"]);
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "v1"]);
  git(repo, ["tag", "v1"]);
  writeFixtureFiles(repo, { includeAdded: true });
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "v2"]);
  git(repo, ["tag", "v2"]);
  return repo;
}

function writeFixtureFiles(repo, { includeAdded }) {
  mkdirp(path.join(repo, "web/api/webrpc"));
  mkdirp(path.join(repo, "web/api"));
  writeFileSync(
    path.join(repo, "web/api/webrpc/routes.go"),
    `package webrpc

import "context"

type WebRPC struct{}

type ThingResponse struct {
  ID string \`json:"id"\`
  Name string
  Hidden string \`json:"-"\`
}

type CommonFields struct {
  Shared string
}

type LeftFields struct {
  CommonFields
  Left string
}

type RightFields struct {
  CommonFields
  Right string
}

type RepeatedResponse struct {
  LeftFields
  RightFields
}

func (w *WebRPC) Thing(ctx context.Context, name string) (ThingResponse, error) {
  return ThingResponse{}, nil
}

func (w *WebRPC) Repeated(ctx context.Context) (RepeatedResponse, error) {
  return RepeatedResponse{}, nil
}

func (w *WebRPC) Inline(ctx context.Context) (struct {
  CommonFields
  Inline string
}, error) {
  return struct {
    CommonFields
    Inline string
  }{}, nil
}

${includeAdded ? `func (w *WebRPC) Added(ctx context.Context) error { return nil }` : ""}
`,
  );
  writeFileSync(
    path.join(repo, "web/api/routes.go"),
    `package api

type Router struct{}

func (r Router) HandleFunc(path string, handler any) Router { return r }
func (r Router) Methods(method string) Router { return r }

func Routes(r Router) {
  r.HandleFunc("/api/status", nil).Methods("GET")
}
`,
  );
}

function mkdirp(dir) {
  mkdirSync(dir, { recursive: true });
}

function git(repo, args) {
  execFileSync(
    "git",
    ["-c", "commit.gpgsign=false", "-c", "tag.gpgSign=false", ...args],
    {
      cwd: repo,
      stdio: "ignore",
    },
  );
}
