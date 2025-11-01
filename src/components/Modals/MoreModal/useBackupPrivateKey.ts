import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useBackupPrivateKey = () => {
  const { exportWallet } = useWalletAdapter();

  const handleBackupPrivateKey = debounce(async () => {
    try {
      // Export the private key using usePrivy hook
      // This will show a modal and handle the export process
      await exportWallet();
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  return {
    handleBackupPrivateKey,
  };
};
