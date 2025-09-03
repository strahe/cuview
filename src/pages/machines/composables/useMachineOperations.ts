import { ref } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";

export function useMachineOperations() {
  const { call } = useCurioQuery();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const cordon = async (machineId: number, machineName?: string) => {
    loading.value = true;
    error.value = null;

    try {
      await call("Cordon", [machineId]);
      return { success: true };
    } catch (err) {
      const errorMessage = `Failed to cordon machine ${machineName || machineId}: ${err instanceof Error ? err.message : String(err)}`;
      error.value = errorMessage;
      console.error(errorMessage, err);
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const uncordon = async (machineId: number, machineName?: string) => {
    loading.value = true;
    error.value = null;

    try {
      await call("Uncordon", [machineId]);
      return { success: true };
    } catch (err) {
      const errorMessage = `Failed to uncordon machine ${machineName || machineId}: ${err instanceof Error ? err.message : String(err)}`;
      error.value = errorMessage;
      console.error(errorMessage, err);
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    loading,
    error,
    cordon,
    uncordon,
    clearError,
  };
}
