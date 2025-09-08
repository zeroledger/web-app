import { createContext } from "react";
import { type Ledger } from "@src/services/ledger";
import { ConnectedWallet } from "@privy-io/react-auth";
import { Chain, mainnet } from "viem/chains";
import { EvmClients } from "@src/services/Clients";
import { ViewAccount } from "@src/services/Account";

export const LedgerContext = createContext<{
  // Ledger
  ledger: Ledger | undefined;
  setLedger: (ledger: Ledger | undefined) => void;
  // Wallet
  wallet: ConnectedWallet | undefined;
  isWalletChanged: boolean;
  isWalletNetworkChanged: boolean;
  isWalletAddressChanged: boolean;
  chainSupported: boolean;
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
  // Logout
  logout: () => Promise<void>;
}>({
  // Ledger
  ledger: undefined,
  setLedger: () => {},
  // Wallet
  wallet: undefined,
  isWalletChanged: false,
  isWalletNetworkChanged: false,
  isWalletAddressChanged: false,
  chainSupported: false,
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
  // Logout
  logout: () => Promise.resolve(),
});
