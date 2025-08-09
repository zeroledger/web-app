import { createContext } from "react";
import { type EvmClientService } from "@src/services/core/evmClient.service";
import { type Chain } from "viem";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export const EvmClientsContext = createContext<{
  evmClientService?: EvmClientService;
  setEvmClientService: (evmClientService: EvmClientService | undefined) => void;
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  targetChain: Chain;
}>({
  setEvmClientService: () => {},
  evmClientService: undefined,
  targetChain: SUPPORTED_CHAINS[0],
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
});
