import { ConnectedWallet } from "@privy-io/react-auth";
import { WALLETS_SKIP_SECOND_STEP } from "@src/common.constants";

/**
 * Checks if a wallet should skip the second step (preview) and go directly to signing
 * @param wallet - The connected wallet
 * @returns true if the wallet should skip the second step, false otherwise
 */
export const shouldSkipSecondStep = (
  wallet: ConnectedWallet | undefined,
): boolean => {
  if (!wallet) {
    return false;
  }

  return WALLETS_SKIP_SECOND_STEP.includes(wallet.walletClientType);
};
