import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Chain, optimismSepolia } from "viem/chains";

import { initialize, LedgerService } from "@src/services/ledger";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { useBalanceUpdates } from "@src/hooks/useBalanceUpdates";
import { useMetadata } from "@src/hooks/useMetadata";
import { useConnectWallet, useWallets } from "@privy-io/react-auth";

const LedgerContext = createContext<{
  onboard: (password: string, chain: Chain) => void;
  ledgerServices?: {
    ledgerService: LedgerService;
    evmClientService: EvmClientService;
    reset: () => Promise<void>;
  };
  privateBalance: bigint;
  isConnecting: boolean;
  initialized: boolean;
  error?: Error;
  symbol: string;
  publicBalance: bigint;
  decimals: number;
}>({
  onboard: () => {},
  privateBalance: 0n,
  isConnecting: false,
  initialized: false,
  symbol: "",
  publicBalance: 0n,
  decimals: 18,
});

const LedgerProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "inProgress" | "done">(
    "idle",
  );
  const [error, setError] = useState<Error>();
  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  const [ledgerServices, setLedgerServices] = useState<{
    ledgerService: LedgerService;
    evmClientService: EvmClientService;
    reset: () => Promise<void>;
  }>();
  const [password, setPassword] = useState<string>();
  const [chain, setChain] = useState<Chain>(optimismSepolia);

  const { wallets, ready } = useWallets();
  const { connectWallet } = useConnectWallet();

  useEffect(() => {
    if (
      ready &&
      wallets.length > 0 &&
      password &&
      chain &&
      !isConnecting &&
      !initialized
    ) {
      const initializeLedger = async () => {
        try {
          setIsConnecting(true);
          const wallet = wallets[0];
          const ledgerServices = await initialize(chain, password!, wallet);
          setLedgerServices(ledgerServices);
          setIsConnecting(false);
          setInitialized(true);
        } catch (error) {
          console.error(error);
          setError(error as Error);
        }
      };
      initializeLedger();
    }
  }, [ready, wallets, chain, password, isConnecting, initialized]);

  const onboard = useCallback(
    (password: string, chain: Chain) => {
      setPassword(password);
      setChain(chain);
      if (!ready || wallets.length === 0) {
        connectWallet();
      }
    },
    [connectWallet, ready, wallets],
  );

  const {
    symbol,
    publicBalance,
    decimals,
    isMetadataLoading,
    metadataError,
    mutate,
  } = useMetadata(TOKEN_ADDRESS, ledgerServices?.evmClientService, initialized);

  const value = useMemo(
    () => ({
      onboard,
      ledgerServices,
      privateBalance,
      isConnecting:
        isConnecting || isMetadataLoading || syncState === "inProgress",
      initialized,
      error: error || metadataError,
      symbol,
      publicBalance,
      decimals,
    }),
    [
      ledgerServices,
      onboard,
      privateBalance,
      isConnecting,
      isMetadataLoading,
      initialized,
      error,
      metadataError,
      symbol,
      publicBalance,
      decimals,
      syncState,
    ],
  );

  useBalanceUpdates(ledgerServices, initialized, setPrivateBalance, mutate);

  useEffect(() => {
    if (ledgerServices && initialized && syncState === "idle") {
      setSyncState("inProgress");
      ledgerServices.ledgerService.start().then(() => {
        setSyncState("done");
      });
    }
  }, [ledgerServices, initialized, syncState]);

  useEffect(() => {
    return () => {
      ledgerServices?.evmClientService?.close();
    };
  }, [ledgerServices]);

  useEffect(() => {
    if (wallets.length === 0) {
      setInitialized(false);
      setSyncState("idle");
      setPassword(undefined);
    }
  }, [wallets]);

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};

export { LedgerContext, LedgerProvider };
