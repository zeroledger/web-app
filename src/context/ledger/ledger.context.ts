import { createContext } from "react";
import { type Ledger } from "@src/services/ledger";
import { Chain, mainnet } from "viem/chains";
import { EvmClients } from "@src/services/Clients";
import { ViewAccount } from "@src/services/Account";
import { Address } from "viem";
import { TOKEN_ADDRESS } from "@src/common.constants";

export const LedgerContext = createContext<{
  // Ledger
  ledger: Ledger | undefined;
  setLedger: (ledger: Ledger | undefined) => void;
  // Switch Chain Modal
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  setTargetChain: (chain: Chain) => void;
  targetChain: Chain;
  // EVM Clients
  evmClients: EvmClients | undefined;
  setEvmClients: (evmClients: EvmClients | undefined) => void;
  // Password
  password: string | undefined;
  setPassword: (password: string | undefined) => void;
  // Authorization
  authorized: boolean;
  setAuthorized: (authorized: boolean) => void;
  // View Account
  viewAccount: ViewAccount | undefined;
  resetViewAccountAuthorization: () => void;
  // Ens Profile
  ensProfile?: {
    name?: string;
    avatar?: string;
  };
  isEnsLoading: boolean;
  // Reset
  reset: () => void;
  // Token Address
  tokenAddress: Address;
  // Explorer base URL for current chain
  scanUrl: string;
}>({
  // Ledger
  ledger: undefined,
  setLedger: () => {},
  // Switch Chain Modal
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
  setTargetChain: () => {},
  targetChain: mainnet,
  // EVM Clients
  evmClients: undefined,
  setEvmClients: () => {},
  // Password
  password: undefined,
  setPassword: () => {},
  // Authorization
  authorized: false,
  setAuthorized: () => {},
  // View Account
  viewAccount: undefined,
  resetViewAccountAuthorization: () => {},
  // Ens Profile
  ensProfile: undefined,
  isEnsLoading: false,
  // Reset
  reset: () => {},
  // Token Address
  tokenAddress: TOKEN_ADDRESS,
  // Explorer base URL for current chain (default empty)
  scanUrl: "",
});
