import {
  LoginModalOptions,
  PrivyProvider,
  WalletListEntry,
} from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";
import { ReactNode } from "react";
import { PRIVY_APP_ID } from "@src/common.constants";

interface PrivyContextProviderProps {
  children: ReactNode;
}

const config = {
  loginMethods: ["wallet"] as LoginModalOptions["loginMethods"],
  appearance: {
    walletChainType: "ethereum-only" as const,
    theme: "#101828" as `#${string}`,
    accentColor: "#6A6FF5" as `#${string}`,
    showWalletLoginFirst: true,
    walletList: [
      "detected_ethereum_wallets",
      "metamask",
      "coinbase_wallet",
      "base_account",
      "rainbow",
      "uniswap",
      "safe",
      "wallet_connect",
    ] as WalletListEntry[],
  },
  supportedChains: [baseSepolia],
  defaultChain: baseSepolia,
};

export const PrivyContextProvider = ({
  children,
}: PrivyContextProviderProps) => {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={config}>
      {children}
    </PrivyProvider>
  );
};
