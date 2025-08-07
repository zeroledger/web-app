import { type LedgerService } from "@src/services/ledger";
import { useCallback, useEffect, useState } from "react";
import { Logger } from "@src/utils/logger";

const logger = new Logger("useLedgerSync");

export function useLedgerSync(
  authorized: boolean,
  ledgerService?: LedgerService,
) {
  const [syncState, setSyncState] = useState<"idle" | "inProgress" | "done">(
    "idle",
  );
  const [blocksToSync, setBlocksToSync] = useState<bigint>();

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
    setBlocksToSync(undefined);
  }, []);

  // Poll for sync status
  useEffect(() => {
    if (!ledgerService || syncState === "idle") return;

    if (syncState === "done") {
      setBlocksToSync(0n);
      return;
    }

    const fetchSyncStatus = async () => {
      try {
        const { anchorBlock, currentBlock } = await ledgerService.syncStatus();
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
  }, [ledgerService, syncState]);

  return {
    syncState,
    resetSyncState,
    blocksToSync,
  };
}
