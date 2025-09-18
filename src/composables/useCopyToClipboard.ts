import { ref } from "vue";

export interface CopyOptions {
  resetDelay?: number;
}

export function useCopyToClipboard(options: CopyOptions = {}) {
  const { resetDelay = 2000 } = options;

  const copied = ref(false);
  const error = ref<string | null>(null);

  const copy = async (text: string): Promise<boolean> => {
    if (!text) return false;

    if (!navigator?.clipboard) {
      error.value = "Clipboard API not available";
      return false;
    }

    try {
      error.value = null;
      await navigator.clipboard.writeText(text);
      copied.value = true;

      setTimeout(() => {
        copied.value = false;
      }, resetDelay);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to copy";
      return false;
    }
  };

  const reset = () => {
    copied.value = false;
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
