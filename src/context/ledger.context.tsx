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

import {
  AccountService,
  initialize,
  LedgerService,
  LedgerServiceEvents,
} from "@src/services/ledger";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { metadata } from "@src/utils/erc20";
import { swrKeyForClient } from "@src/utils/swrKey";
import useSWR from "swr";

const LedgerContext = createContext<{
  initializeLedger: (
    password: string,
    chain?: Chain,
    privateKey?: Hex,
  ) => Promise<void>;
  ledgerServices?: {
    ledgerService: LedgerService;
    accountService: AccountService;
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
  onlyLogin: boolean;
}>({
  initializeLedger: async () => {},
  privateBalance: 0n,
  isConnecting: false,
  connected: false,
  symbol: "",
  publicBalance: 0n,
  decimals: 18,
  onlyLogin: false,
});

const LedgerProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error>();
  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  const [ledgerServices, setLedgerServices] = useState<{
    ledgerService: LedgerService;
    accountService: AccountService;
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

  const fetcher = useCallback(() => {
    if (ledgerServices && connected) {
      return metadata({
        tokenAddress: TOKEN_ADDRESS,
        client: ledgerServices.evmClientService.client,
      });
    }
    return Promise.resolve(["", 0n, 0] as const);
  }, [ledgerServices, connected]);

  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(
    ["/metadata", swrKeyForClient(ledgerServices?.evmClientService.client)],
    fetcher,
  );

  const [symbol, publicBalance, decimals] = onchainWalletData ?? ["", 0n, 0];

  const value = useMemo(
    () => ({
      initializeLedger,
      ledgerServices,
      privateBalance,
      isConnecting: isConnecting && isMetadataLoading,
      connected,
      error: error || metadataError,
      symbol,
      publicBalance,
      decimals,
      onlyLogin: Boolean(ledgerServices?.accountService.hasAccount),
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
    ],
  );

  useEffect(() => {
    if (ledgerServices && connected) {
      ledgerServices.ledgerService.on(
        LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
        setPrivateBalance,
      );
      ledgerServices.ledgerService.on(
        LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE,
        mutate,
      );
      return () => {
        ledgerServices.ledgerService.off(
          LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
          setPrivateBalance,
        );
        ledgerServices.ledgerService.off(
          LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE,
          mutate,
        );
      };
    }
  }, [ledgerServices, connected, mutate]);

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

// account initiation => updates client => updates wallet
// user change pass/chain => call account => client => wallet chain
