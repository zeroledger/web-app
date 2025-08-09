import {
  useState,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { initialize } from "@src/services/ledger";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
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
  const { password, authorized, unlock, setViewAccount, resetViewAccount } =
    useContext(ViewAccountContext);
  const {
    targetChain,
    evmClientService,
    setEvmClientService,
    isSwitchChainModalOpen,
  } = useContext(EvmClientsContext);
  const { wallets } = useWallets();

  const wallet = wallets[0];

  const prevWallet = usePrevious(wallet);
  const prevPassword = usePrevious(password);

  const { syncState, resetSyncState, blocksToSync } = useLedgerSync(
    authorized,
    ledgerService,
  );

  const lifecycle = useCallback(
    async (
      wallet: ConnectedWallet | undefined,
      prevWallet: ConnectedWallet | undefined,
      password: string,
    ) => {
      setIsConnecting(true);
      logger.log("resetting...");
      resetSyncState();
      await ledgerService?.softReset();
      await evmClientService?.close();
      if (!wallet) {
        setLedgerService(undefined);
        setEvmClientService(undefined);
        setIsConnecting(false);
        resetViewAccount();
        return;
      }
      logger.log("new service initialization...");
      const newEvmClientService = new EvmClientService(
        WS_RPC[targetChain.id],
        RPC[targetChain.id],
        pollingInterval[targetChain.id],
        targetChain,
        wallet,
      );
      await newEvmClientService.open();
      const ViewAccountService = await ViewAccountServiceLoader;
      const viewAccount = new ViewAccountService(
        APP_PREFIX_KEY,
        password,
        newEvmClientService,
      );
      const resetProbablyNeeded = await unlock(viewAccount);
      logger.log(`resetProbablyNeeded(unlock): ${resetProbablyNeeded}`);
      logger.log(
        `resetProbablyNeeded(wallet): ${wallet?.address !== prevWallet?.address}`,
      );
      if (wallet?.address !== prevWallet?.address && resetProbablyNeeded) {
        setLedgerService(undefined);
        setEvmClientService(undefined);
        setIsConnecting(false);
        resetViewAccount();
        return;
      }
      const newLedgerService = await initialize(
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
      setViewAccount(viewAccount);
      setLedgerService(newLedgerService);
      setEvmClientService(newEvmClientService);
      setIsConnecting(false);
    },
    [
      resetSyncState,
      ledgerService,
      evmClientService,
      unlock,
      setEvmClientService,
      targetChain,
      setViewAccount,
      resetViewAccount,
    ],
  );

  useEffect(() => {
    console.log(`pass ${password}`);
    console.log(`wallet address ${wallet?.address}`);
    console.log(`wallet chainId ${wallet?.chainId}`);
    console.log(`prevWallet address ${prevWallet?.address}`);
    console.log(`prevWallet chainId ${prevWallet?.chainId}`);
    console.log(`prevPassword ${prevPassword}`);
    if (
      !isSwitchChainModalOpen &&
      password &&
      (wallet?.address !== prevWallet?.address ||
        wallet?.chainId !== prevWallet?.chainId ||
        password !== prevPassword)
    ) {
      lifecycle(wallet, prevWallet, password).catch((e) => setError(e));
    }
  }, [
    isSwitchChainModalOpen,
    password,
    wallet,
    prevWallet,
    prevPassword,
    lifecycle,
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

/**
 * When disconnect => reset all
 * but do not reset if user connecting wallet
 */
