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
  loginMethods: ["wallet"] as LoginModalOptions["loginMethods"],
  appearance: {
    walletChainType: "ethereum-only" as const,
    theme: "#101828" as `#${string}`,
    accentColor: "#6A6FF5" as `#${string}`,
    showWalletLoginFirst: false,
    walletList: [
      "coinbase_wallet",
      "metamask",
      "safe",
      "uniswap",
      "rainbow",
      "rabby_wallet",
      "okx_wallet",
      "phantom",
      "wallet_connect",
    ] as WalletListEntry[],
  },
  // embeddedWallets: {
  //   requireUserPasswordOnCreate: false,
  //   showWalletUIs: true,
  //   ethereum: {
  //     createOnLogin: "users-without-wallets",
  //   },
  // } as const,
  // mfa: {
  //   noPromptOnMfaRequired: false,
  // },
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
