import { APP_PREFIX_KEY } from "@src/common.constants";
import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { ViewAccountContext } from "./viewAccount.context";
import { useWallets } from "@privy-io/react-auth";
import { catchService } from "@src/services/core/catch.service";
import { type ViewAccountService } from "@src/services/viewAccount.service";

const ViewAccountServiceLoader = import(
  "@src/services/viewAccount.service"
).then((module) => module.ViewAccountService);

export const ViewAccountProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const { evmClientService } = useContext(EvmClientsContext);
  const { wallets } = useWallets();
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [viewAccount, setViewAccount] = useState<
    ViewAccountService | undefined
  >(undefined);

  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const createViewAccount = async () => {
      try {
        if (password && evmClientService && !viewAccount) {
          console.log("[zeroledger-app] creating view account");
          setIsLoading(true);
          const ViewAccountService = await ViewAccountServiceLoader;
          const viewAccount = new ViewAccountService(
            APP_PREFIX_KEY,
            password,
            evmClientService,
          );
          if (viewAccount.hasEncryptedViewAccount()) {
            await viewAccount.unlockViewAccount();
            setAuthorized(true);
          } else {
            viewAccount.prepareViewAccount();
          }
          setViewAccount(viewAccount);
          setIsLoading(false);
        }
      } catch (error) {
        catchService.catch(error as Error);
        setPassword(undefined);
        setViewAccount(undefined);
        setAuthorized(false);
        setIsLoading(false);
      }
    };
    createViewAccount();
  }, [password, evmClientService, viewAccount]);

  useEffect(() => {
    if (wallets.length === 0) {
      setPassword(undefined);
    }
  }, [wallets]);

  const authorize = useCallback(async () => {
    if (viewAccount) {
      await viewAccount.authorize();
      setAuthorized(true);
    }
  }, [viewAccount]);

  const value = useMemo(
    () => ({ viewAccount, setPassword, authorized, authorize, isLoading }),
    [viewAccount, setPassword, authorized, authorize, isLoading],
  );

  return (
    <ViewAccountContext.Provider value={value}>
      {children}
    </ViewAccountContext.Provider>
  );
};
