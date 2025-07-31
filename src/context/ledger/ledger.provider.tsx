import { useState, useContext, useEffect, useMemo, ReactNode } from "react";
import { initialize } from "@src/services/ledger";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useWallets } from "@privy-io/react-auth";
import { usePrivateBalance } from "@src/hooks/usePrivateBalance";
import { LedgerContext } from "./ledger.context";
import {
  TOKEN_ADDRESS,
  APP_PREFIX_KEY,
  TES_URL,
  VAULT_ADDRESS,
  FORWARDER_ADDRESS,
  FAUCET_URL,
} from "@src/common.constants";
import { useLedgerSync } from "@src/hooks/useLedgerSync";
import { type LedgerService } from "@src/services/ledger";

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [ledgerService, setLedgerService] = useState<LedgerService>();
  const { viewAccount, authorized } = useContext(ViewAccountContext);
  const { evmClientService, isSwitchChainModalOpen } =
    useContext(EvmClientsContext);
  const { wallets, ready } = useWallets();

  const wallet = wallets[0];

  useEffect(() => {
    if (
      ready &&
      wallet &&
      !isConnecting &&
      !ledgerService &&
      !isSwitchChainModalOpen &&
      viewAccount &&
      evmClientService
    ) {
      const initializeLedger = async () => {
        try {
          console.log("[zeroledger-app] initializing ledger");
          setIsConnecting(true);
          setError(undefined);
          const ledgerService = await initialize(
            wallet,
            viewAccount!,
            evmClientService!,
            APP_PREFIX_KEY,
            TES_URL,
            VAULT_ADDRESS,
            FORWARDER_ADDRESS,
            TOKEN_ADDRESS,
            FAUCET_URL,
          );
          setLedgerService(ledgerService);
          setIsConnecting(false);
        } catch (error) {
          console.error(error);
          setError(error as Error);
          setIsConnecting(false);
        }
      };
      initializeLedger();
    }
  }, [
    ready,
    wallet,
    viewAccount,
    evmClientService,
    isConnecting,
    ledgerService,
    isSwitchChainModalOpen,
  ]);

  const { syncState, resetSyncState } = useLedgerSync(
    authorized,
    ledgerService,
  );

  useEffect(() => {
    if ((!wallet || isSwitchChainModalOpen) && ledgerService) {
      resetSyncState();
      ledgerService?.softReset();
      setLedgerService(undefined);
    }
  }, [
    syncState,
    wallet,
    ledgerService,
    resetSyncState,
    isSwitchChainModalOpen,
  ]);

  const privateBalance = usePrivateBalance(TOKEN_ADDRESS, ledgerService);
  const [blocksToSync, setBlocksToSync] = useState<bigint>();
  const [syncFinished, setSyncFinished] = useState(false);

  // Poll for sync status
  useEffect(() => {
    if (!ledgerService || syncFinished) return;

    const fetchSyncStatus = async () => {
      try {
        const { processedBlock, currentBlock } =
          await ledgerService.syncStatus();
        setBlocksToSync(currentBlock - processedBlock);
        console.log(
          `[zeroledger-app] currentBlock: ${currentBlock}, processedBlock: ${processedBlock}, blocksToSync: ${currentBlock - processedBlock}`,
        );
        if (currentBlock - processedBlock === 0n) {
          setSyncFinished(true);
        }
      } catch (error) {
        console.error("Failed to fetch sync status:", error);
      }
    };

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 500);
    return () => clearInterval(interval);
  }, [ledgerService, syncFinished]);

  const value = useMemo(
    () => ({
      ledgerService,
      privateBalance,
      isConnecting:
        isConnecting ||
        syncState === "inProgress" ||
        (blocksToSync !== undefined && blocksToSync !== 0n),
      error,
      blocksToSync,
    }),
    [
      ledgerService,
      privateBalance,
      isConnecting,
      error,
      blocksToSync,
      syncState,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};
