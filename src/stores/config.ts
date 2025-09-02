import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface CurioConfig {
  endpoint: string;
  version?: string;
  lastValidated?: number;
}

export const useConfigStore = defineStore(
  "config",
  () => {
    const endpoint = ref<string>("");
    const isConfigured = computed(() => endpoint.value.trim() !== "");

    function setEndpoint(newEndpoint: string) {
      endpoint.value = newEndpoint.trim();
    }

    function getEndpoint(): string {
      if (endpoint.value) {
        return endpoint.value;
      }

      // Fallback to environment variable or default
      return import.meta.env.VITE_CURIO_ENDPOINT || "/api/webrpc/v0";
    }

    function initializeFromEnv() {
      const envEndpoint = import.meta.env.VITE_CURIO_ENDPOINT;
      if (envEndpoint) {
        endpoint.value = envEndpoint;
      }
    }

    function resetToDefault() {
      endpoint.value = "";
    }

    return {
      endpoint,
      isConfigured,
      setEndpoint,
      getEndpoint,
      initializeFromEnv,
      resetToDefault,
    };
  },
  {
    persist: {
      pick: ["endpoint"],
    },
  },
);
