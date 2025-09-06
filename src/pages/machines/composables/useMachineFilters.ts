import { computed, ref, type Ref } from "vue";
import type { MachineSummary, MachineFilters } from "@/types/machine";

export function useMachineFilters(machines: Ref<MachineSummary[] | null>) {
  const filters = ref<MachineFilters>({
    search: "",
    status: "all",
    taskFilter: "",
  });

  // Get unique task types for filter options
  const availableTaskTypes = computed(() => {
    if (!machines.value) return [];

    const taskSet = new Set<string>();
    machines.value.forEach((machine) => {
      if (machine.Tasks) {
        machine.Tasks.split(",").forEach((task) => {
          const trimmedTask = task.trim();
          if (trimmedTask) taskSet.add(trimmedTask);
        });
      }
    });

    return Array.from(taskSet).sort();
  });

  // Get status distribution for stats
  const statusDistribution = computed(() => {
    if (!machines.value) return { online: 0, offline: 0, unschedulable: 0 };

    let online = 0;
    let offline = 0;
    let unschedulable = 0;

    machines.value.forEach((machine) => {
      if (machine.Unschedulable) {
        unschedulable++;
      } else {
        const contactMatch = machine.SinceContact.match(/(\d+)s/);
        const secondsSinceContact = contactMatch
          ? parseInt(contactMatch[1])
          : 0;
        if (secondsSinceContact <= 60) {
          online++;
        } else {
          offline++;
        }
      }
    });

    return { online, offline, unschedulable };
  });

  // Filter machines based on current filters
  const filteredMachines = computed(() => {
    if (!machines.value) return [];

    return machines.value.filter((machine) => {
      // Search filter (name and address)
      if (filters.value.search) {
        const searchTerm = filters.value.search.toLowerCase();
        const machineName = (
          machine.Name || `machine-${machine.ID}`
        ).toLowerCase();
        const machineAddress = machine.Address.toLowerCase();

        if (
          !machineName.includes(searchTerm) &&
          !machineAddress.includes(searchTerm)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.value.status !== "all") {
        const contactMatch = machine.SinceContact.match(/(\d+)s/);
        const secondsSinceContact = contactMatch
          ? parseInt(contactMatch[1])
          : 0;
        const isOnline = secondsSinceContact <= 60;

        switch (filters.value.status) {
          case "online":
            if (!isOnline || machine.Unschedulable) return false;
            break;
          case "offline":
            if (isOnline || machine.Unschedulable) return false;
            break;
          case "unschedulable":
            if (!machine.Unschedulable) return false;
            break;
        }
      }

      // Task filter
      if (filters.value.taskFilter) {
        const machineTasks = machine.Tasks || "";
        if (
          !machineTasks
            .toLowerCase()
            .includes(filters.value.taskFilter.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  });

  // Reset all filters
  const resetFilters = () => {
    filters.value = {
      search: "",
      status: "all",
      taskFilter: "",
    };
  };

  return {
    filters,
    availableTaskTypes,
    statusDistribution,
    filteredMachines,
    resetFilters,
  };
}
