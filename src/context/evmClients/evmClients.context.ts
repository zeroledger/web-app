import { createContext } from "react";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { Chain } from "viem/chains";

export const EvmClientsContext = createContext<{
  evmClientService?: EvmClientService;
  setChain: (chain: Chain) => void;
  error?: Error;
}>({
  evmClientService: undefined,
  setChain: () => {},
});
