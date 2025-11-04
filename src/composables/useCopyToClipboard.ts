import { useClipboard } from "@vueuse/core";
import { ref } from "vue";

export interface CopyOptions {
  resetDelay?: number;
}

export function useCopyToClipboard(options: CopyOptions = {}) {
  const { resetDelay = 2000 } = options;

  const { copy: baseCopy, copied } = useClipboard({
    legacy: true,
    copiedDuring: resetDelay,
  });
  const error = ref<string | null>(null);

  const copy = async (text: string): Promise<boolean> => {
    if (!text) return false;

    try {
      error.value = null;
      await baseCopy(text);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to copy";
      return false;
    }
  };

  const reset = () => {
    error.value = null;
  };

  return {
    copy,
    copied,
    error,
    reset,
  };
}

export async function copyToClipboard(
  text: string,
  options: CopyOptions = {},
): Promise<boolean> {
  const { copy } = useCopyToClipboard(options);
  return copy(text);
}
