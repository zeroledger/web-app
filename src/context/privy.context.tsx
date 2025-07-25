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
    theme: "dark" as const,
    accentColor: "#6366f1" as `#${string}`,
    walletList: [
      "detected_ethereum_wallets",
      "coinbase_wallet",
      "metamask",
      "uniswap",
      "safe",
      "wallet_connect",
    ] as WalletListEntry[],
    showWalletLoginFirst: true,
  },
  supportedChains: [optimismSepolia],
  defaultChain: optimismSepolia,
};

export const PrivyContextProvider = ({
  children,
}: PrivyContextProviderProps) => {
  return (
    <PrivyProvider
      appId={process.env.VITE_PRIVY_APP_ID || "cmdisybxk00mmjv0jj7wr52u9"}
      config={config}
    >
      {children}
    </PrivyProvider>
  );
};
