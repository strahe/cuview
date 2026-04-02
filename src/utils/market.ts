import type {
  Mk20DealSummary,
  Mk20DealSummaryRaw,
  Mk20FailedTaskType,
  Mk20PdpDeal,
  Mk20PdpDealRaw,
  Mk20Pipeline,
  Mk20PipelineRaw,
} from "@/types/market";
import { formatBytes as formatSize } from "@/utils/format";
import {
  unwrapSqlNullableNumber,
  unwrapSqlNullableString,
  unwrapSqlNullableTime,
} from "@/utils/sql";

// Filecoin epochs are ~30 seconds, so 30 days ~= 86,400 epochs.
const EPOCHS_IN_MONTH = 86400;
// Binary unit conversion helpers.
const GIB_IN_TIB = 1024;
const ATTOFIL_PER_FIL = 1e18;
const GIB_IN_TIB_BIGINT = 1024n;
const EPOCHS_IN_MONTH_BIGINT = 86400n;
const ATTOFIL_PER_FIL_BIGINT = 10n ** 18n;
// Piece sizes supported by the Curio market UI.
export const MAX_PIECE_SIZE_BYTES = 64 * 1024 ** 3;
export const MIN_PIECE_SIZE_BYTES = 128;
export const DEFAULT_PIECE_SIZE_BYTES = 32 * 1024 ** 3;

export function attoFilToFilPerTiBPerMonth(
  attoFilPerGiBPerEpoch: number | bigint,
): string {
  const exactValue = toSafeIntegerBigInt(attoFilPerGiBPerEpoch);
  if (exactValue !== null) {
    return formatShortestRoundTripDecimal(
      exactValue,
      exactValue * GIB_IN_TIB_BIGINT * EPOCHS_IN_MONTH_BIGINT,
    );
  }

  const approximateValue =
    (Number(attoFilPerGiBPerEpoch) * GIB_IN_TIB * EPOCHS_IN_MONTH) /
    ATTOFIL_PER_FIL;
  return trimTrailingZeros(approximateValue.toPrecision(16));
}

export function filToAttoFilPerGiBPerEpoch(
  filPerTiBPerMonth: number | string,
): number | null {
  const exactValue = convertFilDecimalToAttoFilBigInt(filPerTiBPerMonth);
  if (exactValue !== null) {
    if (exactValue > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    return Number(exactValue);
  }

  const numericValue =
    typeof filPerTiBPerMonth === "string"
      ? Number.parseFloat(filPerTiBPerMonth)
      : filPerTiBPerMonth;
  if (Number.isNaN(numericValue)) {
    return null;
  }

  const attoFilPerGiBPerEpoch =
    (numericValue * ATTOFIL_PER_FIL) / GIB_IN_TIB / EPOCHS_IN_MONTH;
  return Math.round(attoFilPerGiBPerEpoch);
}

function formatShortestRoundTripDecimal(
  attoFilPerGiBPerEpoch: bigint,
  numerator: bigint,
): string {
  if (attoFilPerGiBPerEpoch === 0n) {
    return "0";
  }

  for (let fractionDigits = 0; fractionDigits <= 18; fractionDigits += 1) {
    const scale = 10n ** BigInt(fractionDigits);
    const roundedValue = divideAndRound(
      numerator * scale,
      ATTOFIL_PER_FIL_BIGINT,
    );
    const candidate = formatDecimal(roundedValue, scale);

    if (convertFilDecimalToAttoFilBigInt(candidate) === attoFilPerGiBPerEpoch) {
      return candidate;
    }
  }

  return formatDecimal(numerator, ATTOFIL_PER_FIL_BIGINT);
}

function formatDecimal(numerator: bigint, denominator: bigint): string {
  const sign = numerator < 0n ? "-" : "";
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const integerPart = absoluteNumerator / denominator;
  const fractionalPart = absoluteNumerator % denominator;

  if (fractionalPart === 0n) {
    return `${sign}${integerPart.toString()}`;
  }

  const fractionalDigits = fractionalPart
    .toString()
    .padStart(denominator.toString().length - 1, "0")
    .replace(/0+$/, "");

  return `${sign}${integerPart.toString()}.${fractionalDigits}`;
}

function trimTrailingZeros(value: string): string {
  if (!value.includes(".")) {
    return value;
  }

  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
}

function divideAndRound(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

function convertFilDecimalToAttoFilBigInt(
  value: number | string,
): bigint | null {
  const parsedValue = parseDecimalValue(value);
  if (parsedValue === null) {
    return null;
  }

  return divideAndRound(
    parsedValue.mantissa * ATTOFIL_PER_FIL_BIGINT,
    parsedValue.scale * GIB_IN_TIB_BIGINT * EPOCHS_IN_MONTH_BIGINT,
  );
}

function parseDecimalValue(
  value: number | string,
): { mantissa: bigint; scale: bigint } | null {
  const normalizedValue =
    typeof value === "number" ? value.toString() : value.trim();

  if (
    normalizedValue === "" ||
    normalizedValue === "." ||
    normalizedValue.endsWith(".") ||
    !/^\d*(?:\.\d*)?$/u.test(normalizedValue)
  ) {
    return null;
  }

  const [integerPart = "0", fractionalPart = ""] = normalizedValue.split(".");
  const digits =
    `${integerPart}${fractionalPart}`.replace(/^0+(?=\d)/u, "") || "0";
  return {
    mantissa: BigInt(digits),
    scale: 10n ** BigInt(fractionalPart.length),
  };
}

function toSafeIntegerBigInt(value: number | bigint): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }

  if (!Number.isSafeInteger(value)) {
    return null;
  }

  return BigInt(value);
}

const formatBytesDetailed = (bytes: number): string => {
  const friendly = formatSize(bytes);
  return `${friendly} (${bytes} bytes)`;
};

export function generateSizeOptions(): Array<{ value: number; label: string }> {
  const sizes = [];
  let sizeInBytes = MAX_PIECE_SIZE_BYTES;
  const minSizeInBytes = MIN_PIECE_SIZE_BYTES;

  // Mirror the Curio presets: start at 64 GiB and halve until the protocol minimum.
  while (sizeInBytes >= minSizeInBytes) {
    sizes.push({
      value: sizeInBytes,
      label: formatBytesDetailed(sizeInBytes),
    });
    sizeInBytes = sizeInBytes / 2;
  }
  return sizes;
}

export function getDealStatus(deal: {
  complete: boolean;
  indexed: boolean;
  announce: boolean;
  sector: number | null;
  after_find_deal: boolean;
  after_psd: boolean;
  after_commp: boolean;
  started: boolean;
}): string {
  if (deal.complete) {
    return "(#########) Complete";
  } else if (deal.indexed && deal.announce && !deal.complete) {
    return "(########.) Announcing";
  } else if (deal.indexed) {
    return "(#######..) Indexed";
  } else if (deal.sector != null) {
    return "(######...) Sealing And Indexing";
  } else if (deal.after_find_deal && deal.sector == null) {
    return "(#####....) Assigning Sector";
  } else if (deal.after_psd) {
    return "(####.....) Waiting for DealID";
  } else if (deal.after_commp) {
    return "(###......) Publishing Chain Deal";
  } else if (deal.started) {
    return "(##.......) Checking Data";
  } else {
    return "(#........) Downloading";
  }
}

export function getProgressFromStatus(status: string): number {
  const filled = (status.match(/#/g) || []).length;
  return (filled / 9) * 100;
}

export function getTaskTypeName(type: string): string {
  const names: Record<string, string> = {
    downloading: "Downloading",
    commp: "CommP Verification",
    psd: "PSD Publication",
    find_deal: "Sector Assignment",
    index: "Indexing",
  };
  return names[type] || type;
}

export function normalizeMk20Pipeline(raw: Mk20PipelineRaw): Mk20Pipeline {
  return {
    id: raw.id,
    sp_id: raw.sp_id,
    contract: raw.contract || null,
    client: raw.client,
    piece_cid_v2: unwrapSqlNullableString(raw.piece_cid_v2) ?? "",
    piece_cid: unwrapSqlNullableString(raw.piece_cid) ?? "",
    piece_size: raw.piece_size,
    raw_size: raw.raw_size,
    offline: raw.offline,
    url: unwrapSqlNullableString(raw.url),
    indexing: raw.indexing,
    announce: raw.announce,
    allocation_id: unwrapSqlNullableNumber(raw.allocation_id),
    piece_aggregation: raw.piece_aggregation ?? null,
    started: raw.started,
    downloaded: raw.downloaded,
    commp_task_id: unwrapSqlNullableNumber(raw.commp_task_id),
    after_commp: raw.after_commp,
    deal_aggregation: raw.deal_aggregation,
    aggr_index: raw.aggr_index,
    agg_task_id: unwrapSqlNullableNumber(raw.agg_task_id),
    aggregated: raw.aggregated,
    duration: raw.duration,
    sector: unwrapSqlNullableNumber(raw.sector),
    reg_seal_proof: unwrapSqlNullableNumber(raw.reg_seal_proof),
    sector_offset: unwrapSqlNullableNumber(raw.sector_offset),
    sealed: raw.sealed,
    indexing_created_at: unwrapSqlNullableTime(raw.indexing_created_at),
    indexing_task_id: unwrapSqlNullableNumber(raw.indexing_task_id),
    indexed: raw.indexed,
    complete: raw.complete,
    created_at: raw.created_at,
    miner: raw.miner,
  };
}

export function normalizeMk20DealSummary(
  raw: Mk20DealSummaryRaw,
): Mk20DealSummary {
  return {
    id: raw.id,
    created_at: raw.created_at,
    piece_cid_v2: unwrapSqlNullableString(raw.piece_cid_v2),
    processed: raw.processed,
    error: unwrapSqlNullableString(raw.error),
    miner: unwrapSqlNullableString(raw.miner),
  };
}

export function normalizeMk20PdpDeal(raw: Mk20PdpDealRaw): Mk20PdpDeal {
  return {
    id: raw.id,
    created_at: raw.created_at,
    piece_cid_v2: unwrapSqlNullableString(raw.piece_cid_v2),
    processed: raw.processed,
    error: unwrapSqlNullableString(raw.error),
  };
}

export const getMk20DealStatus = (pipeline: Mk20Pipeline): string => {
  const hasSector = pipeline.sector !== null && pipeline.sector !== undefined;

  if (pipeline.complete) {
    return "(#########) Complete";
  }

  if (!pipeline.complete && pipeline.announce && pipeline.indexed) {
    return "(########.) Announcing";
  }

  if (pipeline.sealed && !pipeline.indexed) {
    return "(#######..) Indexing";
  }

  if (hasSector && !pipeline.sealed) {
    return "(######...) Sealing";
  }

  if (pipeline.aggregated && !hasSector) {
    return "(#####....) Assigning Sector";
  }

  if (pipeline.after_commp && !pipeline.aggregated) {
    return "(####.....) Aggregating Deal";
  }

  if (pipeline.downloaded && !pipeline.after_commp) {
    return "(###......) CommP";
  }

  if (pipeline.started && !pipeline.downloaded) {
    return "(##.......) Downloading";
  }

  return "(#........) Accepted";
};

export const getMk20TaskTypeName = (type: Mk20FailedTaskType): string => {
  const names: Record<Mk20FailedTaskType, string> = {
    downloading: "Downloading",
    commp: "CommP Verification",
    aggregate: "Aggregate",
    index: "Indexing",
  };
  return names[type];
};
