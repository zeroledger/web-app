import {
  LoginModalOptions,
  PrivyProvider,
  WalletListEntry,
} from "@privy-io/react-auth";
import { ReactNode } from "react";
import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  SUPPORTED_CHAINS,
} from "@src/common.constants";

interface PrivyContextProviderProps {
  children: ReactNode;
}

const config = {
  loginMethods: ["email", "wallet"] as LoginModalOptions["loginMethods"],
  appearance: {
    walletChainType: "ethereum-only" as const,
    theme: "#101828" as `#${string}`,
    accentColor: "#6A6FF5" as `#${string}`,
    showWalletLoginFirst: true,
    walletList: [
      "base_account",
      "metamask",
      "safe",
      "coinbase_wallet",
      "uniswap",
      "rainbow",
      "rabby_wallet",
      "phantom",
      "okx_wallet",
      "wallet_connect",
    ] as WalletListEntry[],
  },
  embeddedWallets: {
    requireUserPasswordOnCreate: false,
    showWalletUIs: false,
    ethereum: {
      createOnLogin: "all-users",
    },
  } as const,
  mfa: {
    noPromptOnMfaRequired: false,
  },
  supportedChains: SUPPORTED_CHAINS,
  defaultChain: SUPPORTED_CHAINS[0],
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
