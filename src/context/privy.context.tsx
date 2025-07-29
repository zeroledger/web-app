import {
  LoginModalOptions,
  PrivyProvider,
  WalletListEntry,
} from "@privy-io/react-auth";
import { optimismSepolia } from "viem/chains";
import { ReactNode } from "react";

interface PrivyContextProviderProps {
  children: ReactNode;
}

const config = {
  loginMethods: ["wallet"] as LoginModalOptions["loginMethods"],
  appearance: {
    walletChainType: "ethereum-only" as const,
    theme: "#101828" as `#${string}`,
    accentColor: "#6A6FF5" as `#${string}`,
    showWalletLoginFirst: false,
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
  supportedChains: [optimismSepolia],
  defaultChain: optimismSepolia,
};

export const PrivyContextProvider = ({
  children,
}: PrivyContextProviderProps) => {
  return (
    <PrivyProvider appId={process.env.VITE_PRIVY_APP_ID!} config={config}>
      {children}
    </PrivyProvider>
  );
};
