import { useEffect, useState } from "react";
import { type Ledger, LedgerEvents } from "@src/services/ledger";

export function useConsolidationRatio(ledger?: Ledger) {
  const [consolidationRatio, setConsolidationRatio] = useState<number>(1);

  useEffect(() => {
    const updateConsolidationRatio = async () => {
      if (ledger) {
        try {
          const ratio = await ledger.getConsolidationRatio();
          setConsolidationRatio(ratio);
        } catch (error) {
          console.error("Failed to get consolidation ratio:", error);
          setConsolidationRatio(1);
        }
      }
    };

    const setter = () => {
      updateConsolidationRatio();
    };

    // Initial load
    updateConsolidationRatio();

    // Listen for balance changes to update consolidation ratio
    ledger?.on(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);

    return () => {
      ledger?.off(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
    };
  }, [ledger]);

  return consolidationRatio;
}
