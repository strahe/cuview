import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useDebugStore = defineStore(
  "debug",
  () => {
    const networkSimulation = ref<"normal" | "offline" | "slow" | "timeout">(
      "normal",
    );
    // Debug mode is disabled by default, even in development
    const isDebugMode = ref(false);

    const isNetworkDisabled = computed(
      () => networkSimulation.value === "offline",
    );

    const shouldSimulateTimeout = computed(
      () => networkSimulation.value === "timeout",
    );

    const shouldSimulateSlowNetwork = computed(
      () => networkSimulation.value === "slow",
    );

    const setNetworkSimulation = (mode: typeof networkSimulation.value) => {
      if (!isDebugMode.value) return;
      networkSimulation.value = mode;
      console.log(`[Debug] Network simulation: ${mode}`);
    };

    const toggleDebugMode = () => {
      isDebugMode.value = !isDebugMode.value;
      if (!isDebugMode.value) {
        networkSimulation.value = "normal";
      }
    };

    // Simulate network delay
    const getNetworkDelay = (): number => {
      switch (networkSimulation.value) {
        case "slow":
          return 3000; // 3 seconds delay
        case "timeout":
          return 30000; // 30 seconds (will timeout)
        default:
          return 0;
      }
    };

    // Simulate network error
    const shouldRejectRequest = (): boolean => {
      return networkSimulation.value === "offline";
    };

    return {
      networkSimulation,
      isDebugMode,
      isNetworkDisabled,
      shouldSimulateTimeout,
      shouldSimulateSlowNetwork,
      setNetworkSimulation,
      toggleDebugMode,
      getNetworkDelay,
      shouldRejectRequest,
    };
  },
  {
    persist: {
      pick: ["isDebugMode", "networkSimulation"],
    },
  },
);
