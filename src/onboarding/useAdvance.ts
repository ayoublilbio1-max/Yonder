import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { nextHref, type StepId } from "./steps";

// Go to the next question after a short pause, so the tester sees the selection.
// Double taps are ignored (only one screen is opened).
export function useAdvance(id: StepId) {
  const router = useRouter();
  const busy = useRef(false);
  return useCallback(
    (delayMs = 160) => {
      if (busy.current) return;
      busy.current = true;
      setTimeout(() => {
        router.push(nextHref(id));
        busy.current = false;
      }, delayMs);
    },
    [router, id],
  );
}
