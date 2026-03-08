export const pipelineQueryKeys = {
  porepSectors: ["curio", "PipelinePorepSectors"],
  porepSummary: ["curio", "PorepPipelineSummary"],
  snapSectors: ["curio", "UpgradeSectors"],
  statsSDR: ["curio", "PipelineStatsSDR"],
  statsSnap: ["curio", "PipelineStatsSnap"],
  statsMarket: ["curio", "PipelineStatsMarket"],
};

export const porepInvalidateKeys: unknown[][] = [
  pipelineQueryKeys.porepSectors,
  pipelineQueryKeys.porepSummary,
  pipelineQueryKeys.statsSDR,
];

export const snapInvalidateKeys: unknown[][] = [
  pipelineQueryKeys.snapSectors,
  pipelineQueryKeys.statsSnap,
];
