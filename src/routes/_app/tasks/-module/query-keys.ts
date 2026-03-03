export const taskQueryKeys = {
  summary: ["curio", "ClusterTaskSummary"],
  history: ["curio", "ClusterTaskHistory"],
  stats: ["curio", "HarmonyTaskStats"],
  typeHistory: ["curio", "HarmonyTaskHistory"],
  detail: ["curio", "HarmonyTaskDetails"],
  status: ["curio", "GetTaskStatus"],
  historyById: ["curio", "HarmonyTaskHistoryById"],
  machines: ["curio", "HarmonyTaskMachines"],
};

export const taskInvalidateKeys: unknown[][] = [
  taskQueryKeys.summary,
  taskQueryKeys.history,
  taskQueryKeys.stats,
  taskQueryKeys.typeHistory,
  taskQueryKeys.status,
  taskQueryKeys.historyById,
  taskQueryKeys.detail,
  taskQueryKeys.machines,
];
