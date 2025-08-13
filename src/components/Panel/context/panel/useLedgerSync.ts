import { type Ledger } from "@src/services/ledger";
import { useCallback, useEffect, useState } from "react";
import { Logger } from "@src/utils/logger";

const logger = new Logger("useLedgerSync");

export function useLedgerSync(ledger?: Ledger) {
  const [syncState, setSyncState] = useState<"idle" | "inProgress" | "done">(
    "idle",
  );
  const [blocksToSync, setBlocksToSync] = useState<bigint>();

  const resetSyncState = useCallback(() => {
    setSyncState("idle");
    setBlocksToSync(undefined);
  }, []);

  const syncLedger = useCallback(
    async (ledger: Ledger) => {
      setSyncState("inProgress");
      resetSyncState();
      await ledger.start();
      setSyncState("done");
    },
    [resetSyncState],
  );

  // Poll for sync status
  useEffect(() => {
    if (!ledger || syncState === "idle") return;

    if (syncState === "done") {
      setBlocksToSync(0n);
      return;
    }

    const fetchSyncStatus = async () => {
      try {
        const { anchorBlock, currentBlock } = await ledger.syncStatus();
        const blocksToSync =
          currentBlock <= anchorBlock ? 0n : currentBlock - anchorBlock;
        setBlocksToSync(blocksToSync);
      } catch (error) {
        logger.error(`Failed to fetch sync status: ${error}`);
      }
    };

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 500);
    return () => clearInterval(interval);
  }, [ledger, syncState]);

  return {
    syncState,
    resetSyncState,
    blocksToSync,
    syncLedger,
  };
}
