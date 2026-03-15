import type { Deadline, SectorBucket, SectorBuckets } from "@/types/actor";

export type DeadlineStatus =
  | "proven"
  | "current"
  | "current-danger"
  | "faulty"
  | "part-faulty"
  | "pending"
  | "empty";

const DANGER_ELAPSED_MINUTES = 15;
const GIB_IN_BYTES = 1024 ** 3;
const BINARY_BASE = 1024n;
const POWER_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"] as const;
const TIB_IN_BYTES = BINARY_BASE ** 4n;
const ATTO_FIL = 10n ** 18n;
const ATTO_FIL_DISPLAY_DIVISOR = 10n ** 14n;

export function getDeadlineStatus(deadline: Deadline): DeadlineStatus {
  if (deadline.Current) {
    if (
      deadline.ElapsedMinutes >= DANGER_ELAPSED_MINUTES &&
      !deadline.PartitionsProven
    ) {
      return "current-danger";
    }
    return "current";
  }
  if (deadline.Faulty) return "faulty";
  if (deadline.PartFaulty) return "part-faulty";
  if (deadline.Proven || deadline.PartitionsProven) return "proven";
  if (!deadline.Empty) return "pending";
  return "empty";
}

export function getDeadlineColor(status: DeadlineStatus): string {
  switch (status) {
    case "proven":
      return "bg-success";
    case "current":
      return "bg-primary ring-2 ring-primary/50";
    case "current-danger":
      return "bg-destructive animate-pulse";
    case "faulty":
      return "bg-destructive";
    case "part-faulty":
      return "bg-warning";
    case "pending":
      return "bg-primary/40";
    case "empty":
      return "bg-muted";
  }
}

export function formatDeadlineTooltip(
  deadline: Deadline,
  index: number,
): string {
  const lines: string[] = [
    `Deadline ${index}${deadline.Current ? " (Current)" : ""}`,
  ];

  if (deadline.OpenAt) {
    lines.push(`Opens: ${deadline.Current ? "Now" : deadline.OpenAt}`);
  }
  if (deadline.Current && deadline.ElapsedMinutes > 0) {
    lines.push(`Elapsed: ${deadline.ElapsedMinutes}min`);
  }
  if (deadline.PartitionCount > 0) {
    lines.push(`Partitions: ${deadline.PartitionCount}`);
  }
  if (deadline.Count) {
    lines.push(`Total: ${deadline.Count.Total}`);
    lines.push(`Live: ${deadline.Count.Live}`);
    lines.push(`Active: ${deadline.Count.Active}`);
    if (deadline.Count.Fault > 0) {
      lines.push(`Fault: ${deadline.Count.Fault}`);
    }
    if (deadline.Count.Recovering > 0) {
      lines.push(`Recovering: ${deadline.Count.Recovering}`);
    }
  }
  if (deadline.PartitionCount > 0) {
    lines.push(
      `PoSt: ${deadline.PartitionsPosted}/${deadline.PartitionCount} submitted`,
    );
  }

  return lines.join("\n");
}

export function formatSectorSize(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  const gib = bytes / GIB_IN_BYTES;
  if (gib >= 1) return `${Math.round(gib)} GiB`;
  return `${bytes} B`;
}

export function formatPowerShort(bytes: string): string {
  try {
    const n = BigInt(bytes || "0");
    if (n === 0n) return "0 B";

    let divisor = 1n;
    let unitIndex = 0;

    while (n / divisor >= BINARY_BASE && unitIndex < POWER_UNITS.length - 1) {
      divisor *= BINARY_BASE;
      unitIndex++;
    }

    const whole = n / divisor;
    let fractionDigits = unitIndex === 0 || whole >= 100n ? 0 : 1;
    let scale = 10n ** BigInt(fractionDigits);
    let scaled = roundDiv(n * scale, divisor);

    if (scaled >= BINARY_BASE * scale && unitIndex < POWER_UNITS.length - 1) {
      divisor *= BINARY_BASE;
      unitIndex++;

      const nextWhole = n / divisor;
      fractionDigits = nextWhole >= 100n ? 0 : 1;
      scale = 10n ** BigInt(fractionDigits);
      scaled = roundDiv(n * scale, divisor);
    }

    const unit = POWER_UNITS[unitIndex] ?? "EiB";
    return formatScaledValue(scaled, fractionDigits, unit);
  } catch {
    return "0 B";
  }
}

// --- Chart data builders ---

export interface ExpirationChartPoint {
  label: string;
  days: number;
  all: number;
  cc: number;
}

export function buildExpirationChartData(
  buckets: SectorBuckets,
): ExpirationChartPoint[] {
  const allMap = toBucketMap(buckets.All);
  const ccMap = toBucketMap(buckets.CC);
  const epochs = mergeEpochs(allMap, ccMap);

  return epochs.map((epoch) => ({
    label: `${allMap.get(epoch)?.Days ?? ccMap.get(epoch)?.Days ?? 0}d`,
    days: allMap.get(epoch)?.Days ?? ccMap.get(epoch)?.Days ?? 0,
    all: allMap.get(epoch)?.Count ?? 0,
    cc: ccMap.get(epoch)?.Count ?? 0,
  }));
}

export interface QAPChartPoint {
  label: string;
  days: number;
  all: number;
  cc: number;
}

export function buildQAPChartData(buckets: SectorBuckets): QAPChartPoint[] {
  const allMap = toBucketMap(buckets.All);
  const ccMap = toBucketMap(buckets.CC);
  const epochs = mergeEpochs(allMap, ccMap);

  return epochs.map((epoch) => ({
    label: `${allMap.get(epoch)?.Days ?? ccMap.get(epoch)?.Days ?? 0}d`,
    days: allMap.get(epoch)?.Days ?? ccMap.get(epoch)?.Days ?? 0,
    all: qapToTiB(allMap.get(epoch)?.QAP ?? "0"),
    cc: qapToTiB(ccMap.get(epoch)?.QAP ?? "0"),
  }));
}

export interface VestedFundsChartPoint {
  label: string;
  days: number;
  value: number;
}

export function buildVestedFundsChartData(
  buckets: SectorBuckets,
): VestedFundsChartPoint[] {
  const allMap = toBucketMap(buckets.All);
  const epochs = Array.from(allMap.keys()).sort((a, b) => a - b);

  return epochs.map((epoch) => {
    const bucket = allMap.get(epoch)!;
    return {
      label: `${bucket.Days}d`,
      days: bucket.Days,
      value: attoFILToFIL(bucket.VestedLockedFunds ?? "0"),
    };
  });
}

// --- Internal helpers ---

function toBucketMap(
  buckets: SectorBucket[] | undefined,
): Map<number, SectorBucket> {
  const map = new Map<number, SectorBucket>();
  for (const b of buckets ?? []) {
    map.set(b.BucketEpoch, b);
  }
  return map;
}

function mergeEpochs(...maps: Map<number, SectorBucket>[]): number[] {
  const all = new Set<number>();
  for (const m of maps) {
    for (const k of m.keys()) all.add(k);
  }
  return Array.from(all).sort((a, b) => a - b);
}

function qapToTiB(qap: string): number {
  try {
    const n = BigInt(qap || "0");
    return Number((n * 100n + TIB_IN_BYTES / 2n) / TIB_IN_BYTES) / 100;
  } catch {
    return 0;
  }
}

function attoFILToFIL(value: string): number {
  try {
    const n = BigInt(value || "0");
    // Use two-step division to preserve precision for display
    const filWhole = Number(n / ATTO_FIL);
    const filFraction =
      Number((n % ATTO_FIL) / ATTO_FIL_DISPLAY_DIVISOR) / 10000;
    return filWhole + filFraction;
  } catch {
    return 0;
  }
}

function roundDiv(numerator: bigint, divisor: bigint): bigint {
  return (numerator + divisor / 2n) / divisor;
}

function formatScaledValue(
  scaled: bigint,
  fractionDigits: number,
  unit: (typeof POWER_UNITS)[number],
): string {
  if (fractionDigits === 0) {
    return `${scaled} ${unit}`;
  }

  const scale = 10n ** BigInt(fractionDigits);
  const whole = scaled / scale;
  const fraction = (scaled % scale).toString().padStart(fractionDigits, "0");

  return `${whole}.${fraction} ${unit}`;
}
