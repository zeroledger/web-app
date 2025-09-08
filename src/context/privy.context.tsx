import {
  LoginModalOptions,
  PrivyProvider,
  WalletListEntry,
} from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";
import { ReactNode } from "react";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@src/common.constants";

interface PrivyContextProviderProps {
  children: ReactNode;
}

const config = {
  loginMethods: ["email", "wallet"] as LoginModalOptions["loginMethods"],
  appearance: {
    walletChainType: "ethereum-only" as const,
    theme: "#101828" as `#${string}`,
    accentColor: "#6A6FF5" as `#${string}`,
    showWalletLoginFirst: false,
    walletList: [
      "metamask",
      "base_account",
      "safe",
      "coinbase_wallet",
      "uniswap",
      "rainbow",
      "phantom",
    ] as WalletListEntry[],
  },
  embeddedWallets: {
    requireUserPasswordOnCreate: false,
    showWalletUIs: true,
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  } as const,
  mfa: {
    noPromptOnMfaRequired: false,
  },
  supportedChains: [baseSepolia],
  defaultChain: baseSepolia,
};

export const PrivyContextProvider = ({
  children,
}: PrivyContextProviderProps) => {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={config}
    >
      {children}
    </PrivyProvider>
  );
};
