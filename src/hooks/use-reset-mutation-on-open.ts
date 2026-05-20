import { useLayoutEffect, useRef } from "react";

interface ResettableMutation {
  isPending: boolean;
  reset: () => void;
}

export function useResetMutationOnOpen(
  open: boolean,
  { isPending, reset }: ResettableMutation,
) {
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    const opened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (opened && !isPending) {
      reset();
    }
  }, [isPending, open, reset]);
}
