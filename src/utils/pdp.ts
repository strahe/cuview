import type { PdpFailedTaskType, PdpPipeline } from "@/types/pdp";

export function getPdpPipelineStatus(pipeline: PdpPipeline): string {
  if (pipeline.complete) {
    return "(#########) Complete";
  }

  if (pipeline.announce && pipeline.indexed) {
    return "(########.) Announcing";
  }

  if (pipeline.after_save_cache && !pipeline.indexed) {
    return "(#######..) Indexing";
  }

  if (pipeline.after_add_piece && !pipeline.after_save_cache) {
    return "(######...) Saving Proving Cache";
  }

  if (pipeline.aggregated && !pipeline.after_add_piece) {
    return "(#####....) Adding Piece";
  }

  if (pipeline.after_commp && !pipeline.aggregated) {
    return "(####.....) Aggregating Deal";
  }

  if (pipeline.downloaded && !pipeline.after_commp) {
    return "(###......) CommP";
  }

  if (!pipeline.downloaded) {
    return "(##.......) Downloading";
  }

  return "(#........) Accepted";
}

export function getPdpTaskTypeName(type: PdpFailedTaskType): string {
  const names: Record<PdpFailedTaskType, string> = {
    downloading: "Downloading",
    commp: "CommP Verification",
    aggregate: "Aggregate",
    add_piece: "Add Piece",
    save_cache: "Save Cache",
    index: "Indexing",
  };

  return names[type] ?? type;
}

export function formatPieceCidShort(pieceCid: string): string {
  if (!pieceCid) return "";
  if (pieceCid.length <= 20) {
    return pieceCid;
  }

  const start = pieceCid.slice(0, 12);
  const end = pieceCid.slice(-6);
  return `${start}...${end}`;
}
