export const pdpQueryKeys = {
  // Services
  services: ["curio", "PDPServices"],

  // Keys
  keys: ["curio", "ListPDPKeys"],

  // FS Registry
  fsStatus: ["curio", "FSRegistryStatus"],

  // Pipelines
  pipelines: ["curio", "MK20PDPPipelines"],
  pipelineFailedTasks: ["curio", "MK20PDPPipelineFailedTasks"],

  // Deals
  deals: ["curio", "MK20PDPStorageDeals"],
};

// Invalidation key groups
export const servicesInvalidateKeys: unknown[][] = [pdpQueryKeys.services];

export const keysInvalidateKeys: unknown[][] = [pdpQueryKeys.keys];

export const fsInvalidateKeys: unknown[][] = [pdpQueryKeys.fsStatus];

export const pipelinesInvalidateKeys: unknown[][] = [
  pdpQueryKeys.pipelines,
  pdpQueryKeys.pipelineFailedTasks,
];
