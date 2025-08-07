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
  WS_RPC,
  RPC,
  pollingInterval,
} from "@src/common.constants";
import { useLedgerSync } from "@src/hooks/useLedgerSync";
import { type LedgerService } from "@src/services/ledger";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { usePrevious } from "@src/hooks/usePrevious";
import { Logger } from "@src/utils/logger";

const ViewAccountServiceLoader = import(
  "@src/services/viewAccount.service"
).then((module) => module.ViewAccountService);

const logger = new Logger("LedgerProvider");

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [ledgerService, setLedgerService] = useState<LedgerService>();
  const {
    viewAccount,
    password,
    authorized,
    unlock,
    setViewAccount,
    resetViewAccount,
  } = useContext(ViewAccountContext);
  const {
    evmClientServicePromise,
    initializeEvmClientService,
    closeEvmClientService,
    isSwitchChainModalOpen,
    targetChain,
  } = useContext(EvmClientsContext);
  const { wallets, ready } = useWallets();

  const wallet = wallets[0];

  const prevWallet = usePrevious(wallet);

  const { syncState, resetSyncState, blocksToSync } = useLedgerSync(
    authorized,
    ledgerService,
  );

  useEffect(() => {
    if (wallet !== prevWallet && prevWallet !== undefined) {
      logger.log("wallet changed, resetting");
      ledgerService?.softReset();
      setLedgerService(undefined);
      closeEvmClientService();
      resetViewAccount({
        resetPassword:
          !wallet ||
          wallet.address !== prevWallet?.address ||
          wallet.chainId !== prevWallet.chainId,
      });
      resetSyncState();
      setError(undefined);
    }

    if (wallet && !evmClientServicePromise) {
      logger.log("setting evmClientService");
      initializeEvmClientService(
        new EvmClientService(
          WS_RPC[targetChain.id],
          RPC[targetChain.id],
          pollingInterval[targetChain.id],
          targetChain,
          wallet,
        ),
      );
    }

    if (
      ready &&
      wallet &&
      evmClientServicePromise &&
      !viewAccount &&
      !ledgerService &&
      !isSwitchChainModalOpen &&
      password
    ) {
      const initializeLedger = async () => {
        try {
          logger.log("initializing components");
          setIsConnecting(true);
          const readyEvmClientService = await evmClientServicePromise;
          const ViewAccountService = await ViewAccountServiceLoader;
          const viewAccount = new ViewAccountService(
            APP_PREFIX_KEY,
            password,
            readyEvmClientService,
          );
          await unlock(viewAccount);
          const ledgerService = await initialize(
            wallet,
            viewAccount!,
            readyEvmClientService!,
            APP_PREFIX_KEY,
            TES_URL,
            VAULT_ADDRESS,
            FORWARDER_ADDRESS,
            TOKEN_ADDRESS,
            FAUCET_URL,
          );
          setViewAccount(viewAccount);
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
    password,
    isSwitchChainModalOpen,
    unlock,
    targetChain,
    closeEvmClientService,
    initializeEvmClientService,
    setViewAccount,
    resetViewAccount,
    resetSyncState,
    evmClientServicePromise,
    viewAccount,
    ledgerService,
    setLedgerService,
    prevWallet,
  ]);

  const privateBalance = usePrivateBalance(TOKEN_ADDRESS, ledgerService);
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
