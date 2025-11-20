import { formatBytes as formatSize } from "@/utils/format";
import type {
  Mk20DealSummary,
  Mk20DealSummaryRaw,
  Mk20FailedTaskType,
  Mk20Pipeline,
  Mk20PipelineRaw,
  Mk20PdpDeal,
  Mk20PdpDealRaw,
} from "@/types/market";
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
// Piece sizes supported by the Curio market UI.
export const MAX_PIECE_SIZE_BYTES = 64 * 1024 ** 3;
export const MIN_PIECE_SIZE_BYTES = 128;
export const DEFAULT_PIECE_SIZE_BYTES = 32 * 1024 ** 3;

export function attoFilToFilPerTiBPerMonth(
  attoFilPerGiBPerEpoch: number,
): string {
  const filPerTiBPerMonth =
    (attoFilPerGiBPerEpoch * GIB_IN_TIB * EPOCHS_IN_MONTH) / ATTOFIL_PER_FIL;
  return filPerTiBPerMonth.toFixed(8);
}

export function filToAttoFilPerGiBPerEpoch(filPerTiBPerMonth: number): number {
  const attoFilPerGiBPerEpoch =
    (filPerTiBPerMonth * ATTOFIL_PER_FIL) / GIB_IN_TIB / EPOCHS_IN_MONTH;
  return Math.round(attoFilPerGiBPerEpoch);
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
