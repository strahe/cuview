import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export function writeArtifacts({
  addedInterfaces,
  comparison,
  fromCurio,
  inventory,
  outputDir,
  toCurio,
}) {
  mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, "cuview-contract.json"), inventory);
  writeJson(path.join(outputDir, "curio-from.json"), fromCurio);
  writeJson(path.join(outputDir, "curio-to.json"), toCurio);
  writeJson(path.join(outputDir, "diff.json"), {
    addedInterfaces,
    blockers: comparison.blockers,
    manualReview: comparison.manualReview,
  });

  const reportPath = path.join(outputDir, "report.md");
  writeFileSync(
    reportPath,
    renderReport({
      addedInterfaces,
      comparison,
      fromCurio,
      inventory,
      toCurio,
    }),
  );
  return reportPath;
}

export function renderReport({
  addedInterfaces,
  comparison,
  fromCurio,
  inventory,
  toCurio,
}) {
  const lines = [
    `# Curio Compatibility Target Gate: ${toCurio.ref}`,
    "",
    "## Summary",
    "",
    `- From: \`${fromCurio.ref}\` (${shortSha(fromCurio.sha)})`,
    `- To: \`${toCurio.ref}\` (${shortSha(toCurio.sha)})`,
    `- Cuview RPC inventory entries: ${inventory.rpc.length}`,
    `- Cuview REST inventory entries: ${inventory.rest.length}`,
    `- Compatibility blockers: ${comparison.blockers.length}`,
    `- Manual review items: ${comparison.manualReview.length}`,
    `- Added Curio RPC interfaces: ${addedInterfaces.rpc.length}`,
    `- Added Curio REST interfaces: ${addedInterfaces.rest.length}`,
    "",
    "## Compatibility Blockers",
    "",
    ...formatItems(comparison.blockers),
    "",
    "## Manual Review",
    "",
    ...formatGroupedItems(comparison.manualReview),
    "",
    "## Curio Added Interfaces",
    "",
    "### RPC",
    "",
    ...formatAddedRpc(addedInterfaces.rpc),
    "",
    "### REST",
    "",
    ...formatAddedRest(addedInterfaces.rest),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function formatGroupedItems(items) {
  if (items.length === 0) return ["- None"];
  const lines = Object.entries(countByType(items)).map(
    ([type, count]) => `- ${type}: ${count}`,
  );
  lines.push("", "<details>", "<summary>Details</summary>", "");
  lines.push(...formatItems(items));
  lines.push("", "</details>");
  return lines;
}

function formatItems(items) {
  if (items.length === 0) return ["- None"];
  return items.map((item) => `- ${formatItem(item)}`);
}

function formatItem(item) {
  const location = item.file ? ` (${item.file}:${item.line})` : "";
  const details = Object.entries(item)
    .filter(([key]) => key !== "file" && key !== "line")
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(", ");
  return `${details}${location}`;
}

function formatAddedRpc(items) {
  if (items.length === 0) return ["- None"];
  return items.map((item) => `- ${item.method} (${item.params} params)`);
}

function formatAddedRest(items) {
  if (items.length === 0) return ["- None"];
  return items.map((item) => `- ${item.method} ${item.path}`);
}

function formatValue(value) {
  if (typeof value === "string") return `\`${value}\``;
  return `\`${JSON.stringify(value)}\``;
}

function countByType(items) {
  const counts = {};
  for (const item of items) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  return counts;
}

function shortSha(sha) {
  return sha ? sha.slice(0, 12) : "unknown";
}
