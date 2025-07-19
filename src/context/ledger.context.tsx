import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { type Hex } from "viem";
import { Chain, optimismSepolia } from "viem/chains";

import { initialize, LedgerService } from "@src/services/ledger";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { useBalanceUpdates } from "@src/hooks/useBalanceUpdates";
import { useMetadata } from "@src/hooks/useMetadata";

const LedgerContext = createContext<{
  initializeLedger: (
    password: string,
    chain?: Chain,
    privateKey?: Hex,
  ) => Promise<void>;
  ledgerServices?: {
    ledgerService: LedgerService;
    evmClientService: EvmClientService;
    reset: () => Promise<void>;
  };
  privateBalance: bigint;
  isConnecting: boolean;
  connected: boolean;
  error?: Error;
  symbol: string;
  publicBalance: bigint;
  decimals: number;
}>({
  initializeLedger: async () => {},
  privateBalance: 0n,
  isConnecting: false,
  connected: false,
  symbol: "",
  publicBalance: 0n,
  decimals: 18,
});

const LedgerProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setIsConnected] = useState(false);
  const [sync, setIsInSync] = useState(false);
  const [error, setError] = useState<Error>();
  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  const [ledgerServices, setLedgerServices] = useState<{
    ledgerService: LedgerService;
    evmClientService: EvmClientService;
    reset: () => Promise<void>;
  }>();

  const initializeLedger = useCallback(
    async (
      password: string,
      chain: Chain = optimismSepolia,
      privateKey?: Hex,
    ) => {
      try {
        setIsConnecting(true);
        const ledgerServices = await initialize(chain, password, privateKey);
        setLedgerServices(ledgerServices);
        setIsConnecting(false);
        setIsConnected(true);
      } catch (error) {
        console.error(error);
        setError(error as Error);
      }
    },
    [setLedgerServices],
  );

  const {
    symbol,
    publicBalance,
    decimals,
    isMetadataLoading,
    metadataError,
    mutate,
  } = useMetadata(TOKEN_ADDRESS, ledgerServices?.evmClientService, connected);

  const value = useMemo(
    () => ({
      initializeLedger,
      ledgerServices,
      privateBalance,
      isConnecting: isConnecting || isMetadataLoading || sync,
      connected,
      error: error || metadataError,
      symbol,
      publicBalance,
      decimals,
    }),
    [
      ledgerServices,
      initializeLedger,
      privateBalance,
      isConnecting,
      isMetadataLoading,
      connected,
      error,
      metadataError,
      symbol,
      publicBalance,
      decimals,
      sync,
    ],
  );

  useBalanceUpdates(ledgerServices, connected, setPrivateBalance, mutate);

  useEffect(() => {
    if (ledgerServices?.ledgerService && connected) {
      setIsInSync(true);
      ledgerServices?.ledgerService.start().then(() => {
        setIsInSync(false);
      });
    }
  }, [ledgerServices, connected]);

  useEffect(() => {
    return () => {
      ledgerServices?.evmClientService?.close();
    };
  }, [ledgerServices]);

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};

export { LedgerContext, LedgerProvider };
