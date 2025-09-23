import { useContext } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useBackupPrivateKey = () => {
  const { wallet } = useContext(LedgerContext);
  const { exportWallet } = usePrivy();

  const handleBackupPrivateKey = debounce(async () => {
    try {
      if (!wallet) {
        throw new Error("No wallet connected");
      }

      // Check if wallet is embedded
      if (wallet.walletClientType !== "privy") {
        throw new Error("Backup is only available for embedded wallets");
      }

      // Export the private key using usePrivy hook
      // This will show a modal and handle the export process
      await exportWallet();
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  // Check if the current wallet is an embedded wallet
  const isEmbeddedWallet = wallet?.walletClientType === "privy";

  return {
    handleBackupPrivateKey,
    isEmbeddedWallet,
  };
};
