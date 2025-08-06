import { createContext } from "react";
import { type EvmClientService } from "@src/services/core/evmClient.service";
import { type Chain } from "viem";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export const EvmClientsContext = createContext<{
  evmClientServicePromise?: Promise<EvmClientService>;
  evmClientService?: EvmClientService;
  initializeEvmClientService: (
    evmClientService: EvmClientService,
  ) => Promise<void>;
  closeEvmClientService: () => Promise<void>;
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  targetChain: Chain;
}>({
  evmClientServicePromise: undefined,
  evmClientService: undefined,
  initializeEvmClientService: async () => {},
  closeEvmClientService: async () => {},
  targetChain: SUPPORTED_CHAINS[0],
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
});
