import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { ClientContext } from "@src/context/client.context";
import { create } from "@src/services/init";
import {
  ClientServiceEvents,
  WalletService,
} from "@src/services/wallet.service";
import { TOKEN_ADDRESS } from "@src/common.constants";
import useSWR from "swr";
import { swrKeyForClient } from "@src/utils/swrKey";
import { metadata } from "@src/utils/erc20";

const WalletContext = createContext<{
  walletService: WalletService | undefined;
  publicBalance: bigint;
  privateBalance: bigint;
  isLoading: boolean;
  error: Error | null;
  symbol: string;
  decimals: number;
  loaded: boolean;
}>({
  walletService: undefined,
  publicBalance: 0n,
  privateBalance: 0n,
  isLoading: false,
  error: null,
  symbol: "",
  decimals: 0,
  loaded: false,
});

const axiosInstance = axios.create();

const WalletProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { client, pk } = useContext(ClientContext);

  const [walletService, setWalletService] = useState<
    WalletService | undefined
  >();

  const [isConnecting, setIsConnecting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error>();
  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);

  const fetcher = useCallback(
    () =>
      metadata({
        tokenAddress: TOKEN_ADDRESS,
        client,
      }),
    [client],
  );

  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(["/metadata", swrKeyForClient(client)], fetcher);

  const [symbol, publicBalance, decimals] = onchainWalletData ?? ["", 0n, 0];

  useEffect(() => {
    const walletService = create(axiosInstance, client, pk);
    setWalletService(walletService);
    setIsConnecting(true);
    walletService
      ?.start()
      .then((value) => {
        setPrivateBalance(value!);
        setLoaded(true);
        setIsConnecting(false);
      })
      .catch((error) => {
        setError(error);
        setIsConnecting(false);
      });
  }, [client, pk]);

  useEffect(() => {
    if (symbol && loaded && walletService) {
      walletService?.on(
        ClientServiceEvents.PRIVATE_BALANCE_CHANGE,
        setPrivateBalance,
      );
      walletService?.on(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
      return () => {
        walletService?.off(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
        walletService?.off(
          ClientServiceEvents.PRIVATE_BALANCE_CHANGE,
          setPrivateBalance,
        );
      };
    }
  }, [walletService, symbol, loaded, privateBalance, mutate]);

  return (
    <WalletContext.Provider
      value={{
        walletService,
        publicBalance,
        privateBalance,
        isLoading: isMetadataLoading || isConnecting,
        error: metadataError || error,
        symbol,
        decimals,
        loaded,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { WalletContext, WalletProvider };
