import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ClientServiceEvents } from "@src/services/client/client.controller";
import { useMetadata } from "@src/hooks/erc20";
import { DecoyContext } from "./decoy.context";
import { TOKEN_ADDRESS } from "@src/common.constants";

const WalletContext = createContext<{
  onchainBalance: bigint;
  balance: bigint;
  isLoading: boolean;
  error: Error | null;
  symbol: string;
  decimals: number;
}>({
  onchainBalance: 0n,
  balance: 0n,
  isLoading: false,
  error: null,
  symbol: "",
  decimals: 0,
});

const WalletProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const {
    clientController,
    isConnecting,
    connected,
    error,
    balance: offchainBalance,
  } = useContext(DecoyContext);
  const [balance, setBalance] = useState(offchainBalance);
  const {
    data: metadata,
    isLoading: isMetadataLoading,
    error: metadataError,
  } = useMetadata(TOKEN_ADDRESS);
  const [symbol, onchainBalance, decimals] = metadata ?? ["", 0n, 0];

  useEffect(() => {
    if (symbol && connected && clientController) {
      setBalance(offchainBalance);
      clientController?.on(
        ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
        setBalance,
      );
      return () => {
        clientController?.off(
          ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
          setBalance,
        );
      };
    }
  }, [clientController, symbol, connected, offchainBalance]);

  return (
    <WalletContext.Provider
      value={{
        onchainBalance,
        balance,
        isLoading: isMetadataLoading || isConnecting,
        error: metadataError || error,
        symbol,
        decimals,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { WalletContext, WalletProvider };
