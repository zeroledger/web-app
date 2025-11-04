import { createContext } from "react";
import { type Ledger } from "@src/services/ledger";
import { Chain, mainnet } from "viem/chains";
import { EvmClients } from "@src/services/Clients";
import { Address } from "viem";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { ViewAccount } from "@src/services/Account";

export const LedgerContext = createContext<{
  // wallet
  logout: () => Promise<void>;
  exportWallet: () => Promise<void>;
  connect: () => Promise<void>;
  signIn: () => Promise<void>;
  connectExternalWallet: () => void;
  isExternalWalletConnecting: boolean;
  viewAccount?: ViewAccount;
  // Ledger
  initializing: boolean;
  ledger?: Ledger;
  // Switch Chain Modal
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  targetChain: Chain;
  // EVM Clients
  evmClients?: EvmClients;
  // Authorization
  authorized: boolean;
  setAuthorized: (authorized: boolean) => void;
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
  initializing: false,
  logout: () => Promise.resolve(),
  exportWallet: () => Promise.resolve(),
  connect: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  connectExternalWallet: () => {},
  isExternalWalletConnecting: false,
  viewAccount: undefined,
  ledger: undefined,
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
  targetChain: mainnet,
  evmClients: undefined,
  authorized: false,
  ensProfile: undefined,
  isEnsLoading: false,
  setAuthorized: () => {},
  reset: () => {},
  tokenAddress: TOKEN_ADDRESS,
  scanUrl: "",
});
