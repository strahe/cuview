import ts from "typescript";

const SKIPPED_SOURCE_PATHS = new Set([
  "src/hooks/use-curio-query.ts",
  "src/services/curio-api.ts",
]);
const RPC_HOOKS = new Set(["useCurioRpc", "useCurioRpcMutation"]);
const REST_HOOKS = new Set(["useCurioRest", "useCurioMutation"]);

export function collectCurioSourceUsageFromFiles(files) {
  const usage = { dynamic: [], rest: [], rpc: [] };
  for (const file of files) {
    if (shouldSkipSourceFile(file.path)) continue;
    collectFileUsage(file, usage);
  }
  return usage;
}

export function collectCoverageIssues(inventory, usage) {
  const issues = [];
  const rpcMethods = new Set(inventory.rpc.map((entry) => entry.method));
  const restKeys = new Set(
    inventory.rest.map((entry) => `${entry.method} ${entry.path}`),
  );
  const manualKeys = new Set(
    inventory.manualReview.map((entry) => `${entry.type} ${entry.location}`),
  );

  for (const item of usage.rpc) {
    if (rpcMethods.has(item.method)) continue;
    issues.push({ ...item, type: "missing-rpc" });
  }
  for (const item of usage.rest) {
    if (restKeys.has(`${item.method} ${item.path}`)) continue;
    issues.push({ ...item, type: "missing-rest" });
  }
  for (const item of usage.dynamic) {
    if (manualKeys.has(`${item.type} ${item.location}`)) continue;
    issues.push({
      ...item,
      type:
        item.type === "dynamic-rpc"
          ? "unregistered-dynamic-rpc"
          : "unregistered-dynamic-rest",
    });
  }
  return issues;
}

function collectFileUsage(file, usage) {
  const source = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const apiIdentifiers = collectCurioApiIdentifiers(source);

  function visit(node) {
    if (ts.isCallExpression(node)) {
      collectCallUsage(source, file.path, node, usage, apiIdentifiers);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

function collectCurioApiIdentifiers(source) {
  const identifiers = new Set(["api"]);

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      isCurioApiFactoryCall(node.initializer)
    ) {
      identifiers.add(node.name.text);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left) &&
      isCurioApiFactoryCall(node.right)
    ) {
      identifiers.add(node.left.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return identifiers;
}

function isCurioApiFactoryCall(node) {
  return (
    node &&
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    (node.expression.text === "useCurioApi" ||
      node.expression.text === "createJsonRpcClient")
  );
}

function collectCallUsage(source, filePath, node, usage, apiIdentifiers) {
  const name = callName(node.expression, apiIdentifiers);
  if (!name) return;

  const location = `${filePath}:${lineOf(source, node)}`;
  const literal = stringLiteralValue(node.arguments[0]);

  if (RPC_HOOKS.has(name)) {
    if (literal) {
      usage.rpc.push({
        kind: name === "useCurioRpc" ? "query" : "mutation",
        location,
        method: literal,
      });
      return;
    }
    usage.dynamic.push({
      location,
      reason: `${name} uses a non-literal method`,
      type: "dynamic-rpc",
    });
    return;
  }

  if (name === "call") {
    if (literal) {
      usage.rpc.push({ kind: "direct", location, method: literal });
      return;
    }
    usage.dynamic.push({
      location,
      reason: "api.call uses a non-literal method",
      type: "dynamic-rpc",
    });
    return;
  }

  if (REST_HOOKS.has(name) || name === "restGet" || name === "restPost") {
    const method =
      name === "useCurioRest" || name === "restGet" ? "GET" : "POST";
    if (literal) {
      usage.rest.push({
        kind: method === "GET" ? "query" : "mutation",
        location,
        method,
        path: literal,
      });
      return;
    }
    usage.dynamic.push({
      location,
      reason: `${name} uses a non-literal path`,
      type: "dynamic-rest",
    });
  }
}

function callName(expression, apiIdentifiers) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (!ts.isPropertyAccessExpression(expression)) return null;
  if (
    expression.name.text === "call" &&
    ts.isIdentifier(expression.expression) &&
    apiIdentifiers.has(expression.expression.text)
  ) {
    return "call";
  }
  if (
    expression.name.text === "restGet" ||
    expression.name.text === "restPost"
  ) {
    return expression.name.text;
  }
  return null;
}

function stringLiteralValue(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function shouldSkipSourceFile(filePath) {
  if (!filePath.startsWith("src/")) return true;
  if (SKIPPED_SOURCE_PATHS.has(filePath)) return true;
  return /\.(test|spec)\.(ts|tsx)$/.test(filePath);
}

function lineOf(source, node) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}
