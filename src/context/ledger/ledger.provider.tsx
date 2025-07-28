import { useState, useContext, useEffect, useMemo, ReactNode } from "react";
import { initialize, LedgerService } from "@src/services/ledger";
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

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [ledgerService, setLedgerService] = useState<LedgerService>();
  const { viewAccount, authorized } = useContext(ViewAccountContext);
  const { evmClientService } = useContext(EvmClientsContext);
  const { wallets, ready } = useWallets();

  useEffect(() => {
    if (
      ready &&
      wallets.length > 0 &&
      !isConnecting &&
      !ledgerService &&
      viewAccount &&
      evmClientService
    ) {
      const initializeLedger = async () => {
        try {
          setIsConnecting(true);
          const wallet = wallets[0];
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
        }
      };
      initializeLedger();
    }
  }, [
    ready,
    wallets,
    isConnecting,
    ledgerService,
    viewAccount,
    evmClientService,
  ]);

  const { syncState, resetSyncState } = useLedgerSync(
    authorized,
    ledgerService,
  );

  useEffect(() => {
    if (wallets.length === 0 && ledgerService) {
      resetSyncState();
      ledgerService?.reset();
      setLedgerService(undefined);
    }
  }, [syncState, wallets, ledgerService, resetSyncState]);

  const privateBalance = usePrivateBalance(TOKEN_ADDRESS, ledgerService);

  const value = useMemo(
    () => ({
      ledgerService,
      privateBalance,
      isConnecting: isConnecting || syncState === "inProgress",
      error,
    }),
    [ledgerService, privateBalance, isConnecting, error, syncState],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};
