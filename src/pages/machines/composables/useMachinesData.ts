import { useCachedQuery } from "@/composables/useCachedQuery";
import type { MachineSummary, MachineInfo } from "@/types/machine";

export function useMachinesData() {
  const {
    data: machines,
    loading,
    error,
    refresh,
  } = useCachedQuery<MachineSummary[]>("ClusterMachines", [], {
    pollingInterval: 5000, // Refresh every 5 seconds
  });

  return {
    machines,
    loading,
    error,
    refresh,
  };
}

export function useMachineDetail(machineId: number) {
  const {
    data: machineInfo,
    loading,
    error,
    refresh,
  } = useCachedQuery<MachineInfo>("ClusterNodeInfo", [machineId], {
    pollingInterval: 10000, // Refresh every 10 seconds
  });

  return {
    machineInfo,
    loading,
    error,
    refresh,
  };
}
