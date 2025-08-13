import { useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import { initialize } from "@src/services/ledger";
import { type ConnectedWallet } from "@privy-io/react-auth";
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
import { useLedgerSync } from "./useLedgerSync";
import { type Ledger } from "@src/services/ledger";
import { EvmClients } from "@src/services/Clients";
import { Logger } from "@src/utils/logger";
import { useViewAccountAuthorization } from "./useViewAccountAuthorization";
import { usePrivyWalletAdapter } from "./usePrivyWalletAdapter";
import { useSwitchModal } from "./useSwitchModal";
import { usePrivateBalance } from "./usePrivateBalance";
import { ViewAccount } from "@src/services/Account";

const logger = new Logger("LedgerProvider");
const viewAccount = new ViewAccount(APP_PREFIX_KEY);

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [ledger, setLedger] = useState<Ledger>();
  const {
    password,
    setPassword,
    authorized,
    resetViewAccountAuthorization,
    setAuthorized,
  } = useViewAccountAuthorization();
  const [evmClients, setEvmClients] = useState<EvmClients>();
  const { wallet, isWalletChanged, prevWallet, chainSupported } =
    usePrivyWalletAdapter();

  const { syncState, resetSyncState, blocksToSync } = useLedgerSync(
    authorized,
    ledger,
  );

  const {
    isSwitchChainModalOpen,
    openSwitchChainModal,
    closeSwitchChainModal,
    targetChain,
    setTargetChain,
  } = useSwitchModal(evmClients);
  const privateBalance = usePrivateBalance(
    TOKEN_ADDRESS,
    isWalletChanged,
    chainSupported,
    ledger,
    evmClients,
  );

  const lifecycle = useCallback(
    async (
      wallet: ConnectedWallet | undefined,
      prevWallet: ConnectedWallet | undefined,
      password: string,
    ) => {
      try {
        setIsConnecting(true);
        logger.log("close previous services");
        resetSyncState();
        await ledger?.softReset();
        if (!wallet) {
          setLedger(undefined);
          setEvmClients(undefined);
          setIsConnecting(false);
          resetViewAccountAuthorization();
          return;
        }
        logger.log("prepare new evm clients setup");
        const newEvmClientService = new EvmClients(
          WS_RPC[targetChain.id],
          RPC[targetChain.id],
          pollingInterval[targetChain.id],
          targetChain,
          wallet,
        );
        setEvmClients(newEvmClientService);

        const externalClient = await newEvmClientService.externalClient();

        if (
          viewAccount.hasEncryptedViewAccount(externalClient.account.address)
        ) {
          await viewAccount.unlockViewAccount(
            externalClient.account.address,
            password,
          );
          setAuthorized(true);
        } else {
          viewAccount.prepareViewAccount(
            externalClient.account.address,
            password,
          );
          setAuthorized(false);
        }
        const newLedger = await initialize(
          wallet,
          viewAccount!,
          newEvmClientService!,
          APP_PREFIX_KEY,
          TES_URL,
          VAULT_ADDRESS,
          FORWARDER_ADDRESS,
          TOKEN_ADDRESS,
          FAUCET_URL,
        );
        setLedger(newLedger);
        logger.log("set ledger");
      } catch (e) {
        if (wallet?.address !== prevWallet?.address) {
          logger.log("full reinitialization needed");
          setLedger(undefined);
          resetViewAccountAuthorization();
          return;
        }
        const err = e as Error;
        const isInvalidPassword = err.message === "aes/gcm: invalid ghash tag";
        if (isInvalidPassword) {
          setError(new Error("Unexpected error"));
        } else {
          console.error(err);
          setError(err);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [
      resetSyncState,
      targetChain,
      resetViewAccountAuthorization,
      ledger,
      setAuthorized,
    ],
  );

  useEffect(() => {
    if (password && isWalletChanged && chainSupported) {
      lifecycle(wallet, prevWallet, password).catch((e) => setError(e));
    }
  }, [
    chainSupported,
    password,
    wallet,
    prevWallet,
    isWalletChanged,
    lifecycle,
  ]);

  const open = useCallback(
    (password: string) => {
      setPassword(password);
      lifecycle(wallet, prevWallet, password);
    },
    [wallet, prevWallet, lifecycle, setPassword],
  );

  const value = useMemo(
    () => ({
      ledger,
      privateBalance,
      isConnecting:
        isConnecting ||
        syncState === "inProgress" ||
        (blocksToSync !== undefined && blocksToSync !== 0n),
      error,
      blocksToSync,
      wallet,
      clearError: () => setError(undefined),
      open,
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      setTargetChain,
      targetChain,
      evmClients,
      password,
      authorized,
      setAuthorized,
      viewAccount,
      isWalletChanged,
      chainSupported,
    }),
    [
      ledger,
      privateBalance,
      isConnecting,
      error,
      blocksToSync,
      syncState,
      wallet,
      setError,
      open,
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      setTargetChain,
      targetChain,
      password,
      authorized,
      setAuthorized,
      evmClients,
      isWalletChanged,
      chainSupported,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};

/**
 * connect -> pass -> auth -> page: page should check this and do navigation
 * connect -> pass -> page: page should check this and do navigation
 * page -> change wallet to new -> pass -> auth -> page: page should check this and do navigation
 * page -> change wallet to auth with different pass -> pass -> auth -> page: page should check this and do navigation
 * page -> change wallet to auth with same pass -> page: page should check this and do navigation
 * auth -> change wallet -> pass -> auth: auth page should reset password and redirect to pass page
 */
