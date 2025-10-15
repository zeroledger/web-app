import {
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import {
  RPC,
  pollingInterval,
  WS_RPC,
  FAUCET_URL,
  APP_PREFIX_KEY,
  TES_URL,
  VAULT_ADDRESS,
  INIT_SYNC_BLOCK,
} from "@src/common.constants";
import { usePrivateBalance } from "./usePrivateBalance";
import { useConsolidationRatio } from "./useConsolidationRatio";
import { useLedgerSync } from "./useLedgerSync";
import { Address } from "viem";
import { EvmClients } from "@src/services/Clients";
import { initialize } from "@src/services/ledger";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { PanelContext } from "./panel.context";
import { prover } from "@src/utils/prover";
import { useMetadata } from "@src/hooks/useMetadata";

export const PanelProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const { wallet, isWalletChanged, chainSupported, getAccount, getProvider } =
    useWalletAdapter();
  const {
    ledger,
    evmClients,
    viewAccount,
    setEvmClients,
    setAuthorized,
    setLedger,
    targetChain,
    password,
    reset,
    tokenAddress,
  } = useContext(LedgerContext);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
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
    wallet?.address as Address,
    chainSupported,
    evmClients,
  );

  const privateBalance = usePrivateBalance(mutate, ledger);
  const { ratio: consolidationRatio, balanceForConsolidation } =
    useConsolidationRatio(ledger);

  const accountSwitch = useCallback(async () => {
    try {
      setIsConnecting(true);
      const [account, provider] = await Promise.all([
        getAccount(),
        getProvider(),
      ]);
      const newEvmClientService = new EvmClients(
        WS_RPC[targetChain.id],
        RPC[targetChain.id],
        pollingInterval[targetChain.id],
        targetChain,
        {
          account,
          provider,
          silentSigner: wallet.walletClientType === "privy",
        },
      );
      setEvmClients(newEvmClientService);
      await ledger?.watcher.softReset();
      const externalClient = newEvmClientService.externalClient();
      await viewAccount!
        .unlockViewAccount(externalClient.account.address, password!)
        .catch(reset);
      setAuthorized(true);
      const newLedger = await initialize(
        wallet!,
        viewAccount!,
        newEvmClientService!,
        APP_PREFIX_KEY,
        TES_URL,
        VAULT_ADDRESS,
        tokenAddress,
        FAUCET_URL,
        INIT_SYNC_BLOCK,
      );
      setLedger(newLedger);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsConnecting(false);
    }
  }, [
    password,
    wallet,
    viewAccount,
    setEvmClients,
    setAuthorized,
    setLedger,
    targetChain,
    ledger,
    reset,
    tokenAddress,
    getAccount,
    getProvider,
  ]);

  useEffect(() => {
    if (ledger) {
      syncLedger(ledger);
    }
    return () => {
      ledger?.watcher.softReset();
    };
  }, [ledger, syncLedger]);

  useEffect(() => {
    if (!isWalletChanged || !wallet) {
      return;
    }
    const unregisteredAccount = !viewAccount!.hasEncryptedViewAccount(
      wallet.address as Address,
    );

    if (unregisteredAccount) {
      reset();
      return;
    }

    if (!unregisteredAccount && chainSupported) {
      accountSwitch();
    }
  }, [
    isWalletChanged,
    accountSwitch,
    viewAccount,
    wallet,
    reset,
    chainSupported,
    isConnecting,
  ]);

  const value = useMemo(
    () => ({
      symbol,
      publicBalance,
      decimals,
      metadataError,
      privateBalance,
      isLoading:
        isConnecting ||
        syncState === "inProgress" ||
        (blocksToSync !== undefined && blocksToSync !== 0n) ||
        isMetadataLoading,
      error,
      blocksToSync,
      consolidationRatio,
      balanceForConsolidation,
    }),
    [
      syncState,
      blocksToSync,
      isConnecting,
      error,
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
