import { useMemo, ReactNode, useEffect, useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { usePrivateBalance } from "./usePrivateBalance";
import { useConsolidationRatio } from "./useConsolidationRatio";
import { useLedgerSync } from "./useLedgerSync";
import { Address } from "viem";
import { PanelContext } from "./panel.context";
import { prover } from "@src/utils/prover";
import { useMetadata } from "@src/hooks/useMetadata";

export const PanelProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const { ledger, evmClients, tokenAddress } = useContext(LedgerContext);
  const { syncState, blocksToSync, syncLedger } = useLedgerSync(ledger);

  const {
    symbol,
    publicBalance,
    decimals,
    isMetadataLoading,
    metadataError,
    mutate,
  } = useMetadata(
    tokenAddress,
    evmClients?.primaryClient()?.account.address as Address,
    true,
    evmClients,
  );

  const privateBalance = usePrivateBalance(mutate, ledger);
  const { ratio: consolidationRatio, balanceForConsolidation } =
    useConsolidationRatio(ledger);

  useEffect(() => {
    if (ledger) {
      syncLedger(ledger);
    }
    return () => {
      ledger?.watcher.softReset();
    };
  }, [ledger, syncLedger]);

  const value = useMemo(
    () => ({
      symbol,
      publicBalance,
      decimals,
      metadataError,
      privateBalance,
      isLoading:
        syncState === "inProgress" ||
        (blocksToSync !== undefined && blocksToSync !== 0n) ||
        isMetadataLoading,
      blocksToSync,
      consolidationRatio,
      balanceForConsolidation,
    }),
    [
      syncState,
      blocksToSync,
      privateBalance,
      symbol,
      publicBalance,
      decimals,
      isMetadataLoading,
      metadataError,
      consolidationRatio,
      balanceForConsolidation,
    ],
  );

  useEffect(() => {
    // do not wait for sequential circuits load
    void prover.preloadVitalCircuits();
  }, []);

  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
};
