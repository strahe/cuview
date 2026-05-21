import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copyRequestId = useRef(0);
  const timeoutRef = useRef(timeout);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = timeout;
  }, [timeout]);

  useEffect(() => {
    return () => {
      if (resetTimeout.current !== null) {
        clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    const requestId = copyRequestId.current + 1;
    copyRequestId.current = requestId;
    const clearResetTimeout = () => {
      if (resetTimeout.current !== null) {
        clearTimeout(resetTimeout.current);
        resetTimeout.current = null;
      }
    };
    const isLatestRequest = () => requestId === copyRequestId.current;

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      clearResetTimeout();
      setCopied(false);
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      if (!isLatestRequest()) {
        return true;
      }
      setCopied(true);
      clearResetTimeout();
      resetTimeout.current = setTimeout(() => {
        setCopied(false);
        resetTimeout.current = null;
      }, timeoutRef.current);
      return true;
    } catch {
      if (!isLatestRequest()) {
        return false;
      }
      clearResetTimeout();
      setCopied(false);
      return false;
    }
  }, []);

  return { copied, copy };
}
