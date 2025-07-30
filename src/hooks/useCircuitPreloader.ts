import { useCallback, useState } from "react";
import { prover } from "@src/utils/prover";

export function useCircuitPreloader() {
  const [isPreloading, setIsPreloading] = useState(false);
  const preload = useCallback(() => {
    setIsPreloading(true);
    prover.preloadAllCircuits();
    setIsPreloading(false);
  }, []);

  return { isPreloading, preload };
}
