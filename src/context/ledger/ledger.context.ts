import { createContext } from "react";
import { type Ledger } from "@src/services/ledger";
import { ConnectedWallet } from "@privy-io/react-auth";
import { Chain, mainnet } from "viem/chains";
import { EvmClients } from "@src/services/Clients";
import { ViewAccount } from "@src/services/Account";

export const LedgerContext = createContext<{
  ledger?: Ledger;
  privateBalance: bigint;
  isConnecting: boolean;
  error?: Error;
  blocksToSync?: bigint;
  wallet?: ConnectedWallet;
  clearError: () => void;
  open: (password: string) => void;
  isSwitchChainModalOpen: boolean;
  openSwitchChainModal: () => void;
  closeSwitchChainModal: () => void;
  setTargetChain: (chain: Chain) => void;
  targetChain: Chain;
  evmClients?: EvmClients;
  password?: string;
  authorized: boolean;
  viewAccount?: ViewAccount;
  setAuthorized: (authorized: boolean) => void;
  isWalletChanged: boolean;
  chainSupported: boolean;
}>({
  privateBalance: 0n,
  isConnecting: false,
  blocksToSync: undefined,
  wallet: undefined,
  clearError: () => {},
  open: () => {},
  isSwitchChainModalOpen: false,
  openSwitchChainModal: () => {},
  closeSwitchChainModal: () => {},
  setTargetChain: () => {},
  targetChain: mainnet,
  evmClients: undefined,
  password: undefined,
  authorized: false,
  viewAccount: undefined,
  setAuthorized: () => {},
  isWalletChanged: false,
  chainSupported: false,
});
