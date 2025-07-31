import { createContext } from "react";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { Chain } from "viem";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export const EvmClientsContext = createContext<{
  evmClientService?: EvmClientService;
  error?: Error;
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  targetChain: Chain;
}>({
  evmClientService: undefined,
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
  targetChain: SUPPORTED_CHAINS[0],
});
