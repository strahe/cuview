import { ref } from "vue";
import { useForm } from "@tanstack/vue-form";
import { useConfigStore } from "@/stores/config";
import { testEndpointConnection } from "@/utils/testConnection";

const FALLBACK_ENDPOINT = "ws://localhost:4701/api/webrpc/v0";

export interface EndpointSettingsFormOptions {
  initialValue?: string;
  timeout?: number;
  onSuccess?: (normalizedEndpoint: string) => void | Promise<void>;
}

export const defaultEndpoint =
  import.meta.env.VITE_CURIO_ENDPOINT || FALLBACK_ENDPOINT;

export const validateEndpoint = (endpoint: string): boolean => {
  if (!endpoint.trim()) return false;

  try {
    if (endpoint.startsWith("/")) return true;

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      new URL(endpoint);
      return true;
    }

    if (endpoint.startsWith("ws://") || endpoint.startsWith("wss://")) {
      const httpUrl = endpoint.replace(/^wss?:/, "http:");
      new URL(httpUrl);
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const normalizeEndpoint = (endpoint: string): string => {
  if (endpoint.startsWith("/")) return endpoint;

  if (endpoint.startsWith("http://")) {
    return endpoint.replace("http://", "ws://");
  }

  if (endpoint.startsWith("https://")) {
    return endpoint.replace("https://", "wss://");
  }

  return endpoint;
};

type EndpointFormValues = {
  endpoint: string;
};

type ConnectionResult = "success" | "failed" | "timeout";

export const useEndpointSettingsForm = (
  options: EndpointSettingsFormOptions = {},
) => {
  const configStore = useConfigStore();
  const submissionError = ref<string | null>(null);
  const isSuccessful = ref(false);
  const timeout = options.timeout ?? 3000;
  const timeoutSeconds = Math.ceil(timeout / 1000);

  const runConnectionTest = async (
    endpoint: string,
  ): Promise<ConnectionResult> => {
    const value = endpoint.trim();
    if (!validateEndpoint(value)) {
      return "failed";
    }

    try {
      const normalized = normalizeEndpoint(value);

      const connectionPromise = (async () => {
        const passed = await testEndpointConnection(normalized, timeout);
        return passed ? ("success" as const) : ("failed" as const);
      })();

      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<ConnectionResult>((resolve) => {
        timeoutHandle = setTimeout(() => resolve("timeout"), timeout);
      });

      const result = await Promise.race([connectionPromise, timeoutPromise]);

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      if (result === "timeout") {
        void connectionPromise.catch(() => undefined);
      }

      return result;
    } catch {
      return "failed";
    }
  };

  const form = useForm({
    defaultValues: {
      endpoint: options.initialValue ?? configStore.getEndpoint(),
    },
    onSubmit: async ({ value }: { value: EndpointFormValues }) => {
      submissionError.value = null;
      isSuccessful.value = false;

      const endpointValue = value.endpoint.trim();
      const connectionResult = await runConnectionTest(endpointValue);

      if (connectionResult !== "success") {
        submissionError.value =
          connectionResult === "timeout"
            ? `Connection timed out after ${timeoutSeconds}s. Please verify the endpoint and server availability.`
            : "Cannot connect to Curio server. Please verify the endpoint and server status.";
        throw new Error(submissionError.value);
      }

      const normalized = normalizeEndpoint(endpointValue);
      configStore.setEndpoint(normalized);
      isSuccessful.value = true;
      await options.onSuccess?.(normalized);
    },
  });

  const isSubmitting = form.useStore((state: { isSubmitting: boolean }) => {
    return state.isSubmitting;
  });
  const canSubmit = form.useStore((state: { canSubmit: boolean }) => {
    return state.canSubmit;
  });

  const endpointValidators = {
    onChange: ({ value }: { value: string }) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "Please enter a Curio API endpoint";
      }
      if (!validateEndpoint(trimmed)) {
        return "Invalid endpoint format. Use /path, ws://, wss://, http://, or https://";
      }
      return undefined;
    },
  };

  const resetFormFromConfig = () => {
    form.reset({
      endpoint: configStore.getEndpoint(),
    });
    submissionError.value = null;
    isSuccessful.value = false;
  };

  const resetToDefault = () => {
    form.setFieldValue("endpoint", normalizeEndpoint(defaultEndpoint));
    submissionError.value = null;
    isSuccessful.value = false;
  };

  const clearSuccess = () => {
    isSuccessful.value = false;
  };

  return {
    form,
    isSubmitting,
    canSubmit,
    submissionError,
    isSuccessful,
    endpointValidators,
    resetFormFromConfig,
    resetToDefault,
    runConnectionTest,
    clearSuccess,
  };
};
