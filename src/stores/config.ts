import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { DEFAULT_ENDPOINT } from "@/utils/endpoint";

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

      return DEFAULT_ENDPOINT;
    }

    function resetToDefault() {
      endpoint.value = DEFAULT_ENDPOINT;
    }

    return {
      endpoint,
      isConfigured,
      setEndpoint,
      getEndpoint,
      resetToDefault,
    };
  },
  {
    persist: {
      pick: ["endpoint"],
    },
  },
);
