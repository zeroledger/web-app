import { ReactNode, useEffect, useMemo, useState } from "react";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { WS_RPC } from "@src/common.constants";
import { RPC } from "@src/common.constants";
import { pollingInterval } from "@src/common.constants";
import { useWallets } from "@privy-io/react-auth";
import { Chain, optimismSepolia } from "viem/chains";
import { EvmClientsContext } from "./evmClients.context";

export const EvmClientsProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<Error>();
  const [evmClientService, setEvmClientService] = useState<
    EvmClientService | undefined
  >(undefined);
  const [chain, setChain] = useState<Chain>(optimismSepolia);
  const { wallets } = useWallets();

  useEffect(() => {
    const create = async () => {
      try {
        const evmClientService = new EvmClientService(
          WS_RPC[chain.id],
          RPC[chain.id],
          pollingInterval[chain.id],
          chain,
          wallets[0],
        );
        await evmClientService.open();
        setEvmClientService(evmClientService);
      } catch (error) {
        setError(error as Error);
      }
    };
    if (wallets.length > 0 && !evmClientService) {
      create();
    }
    return () => evmClientService?.close();
  }, [wallets, chain, evmClientService]);

  const value = useMemo(
    () => ({ setChain, evmClientService, error }),
    [setChain, evmClientService, error],
  );

  return (
    <EvmClientsContext.Provider value={value}>
      {children}
    </EvmClientsContext.Provider>
  );
};
