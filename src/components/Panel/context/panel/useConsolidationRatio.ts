import { useEffect, useState } from "react";
import { type Ledger, LedgerEvents } from "@src/services/ledger";

export function useConsolidationRatio(ledger?: Ledger) {
  const [consolidationParams, setConsolidationParams] = useState<{
    ratio: number;
    balanceForConsolidation: bigint;
  }>({ ratio: 1, balanceForConsolidation: 0n });

  useEffect(() => {
    const updateConsolidationRatio = async () => {
      if (ledger) {
        try {
          const data = await ledger.watcher.getConsolidationRatio();
          setConsolidationParams(data);
        } catch (error) {
          console.error("Failed to get consolidation ratio:", error);
          setConsolidationParams({ ratio: 1, balanceForConsolidation: 0n });
        }
      }
    };

    const setter = () => {
      updateConsolidationRatio();
    };

    // Initial load
    updateConsolidationRatio();

    // Listen for balance changes to update consolidation ratio
    ledger?.watcher.on(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);

    return () => {
      ledger?.watcher.off(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
    };
  }, [ledger]);

  return consolidationParams;
}
