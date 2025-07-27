import { LedgerService } from "@src/services/ledger";
import { useCallback, useEffect, useState } from "react";

export function useLedgerSync(
  authorized: boolean,
  ledgerService?: LedgerService,
) {
  const [syncState, setSyncState] = useState<"idle" | "inProgress" | "done">(
    "idle",
  );

  useEffect(() => {
    const syncLedger = async () => {
      if (authorized && ledgerService) {
        setSyncState("inProgress");
        await ledgerService.start();
        setSyncState("done");
      }
    };
    syncLedger();
  }, [authorized, ledgerService]);

  const resetSyncState = useCallback(() => {
    setSyncState("idle");
  }, []);

  return {
    syncState,
    resetSyncState,
  };
}
