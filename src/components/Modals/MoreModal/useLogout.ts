import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useLogout = () => {
  const { logout, wallet } = useWalletAdapter();

  const handleLogout = debounce(async () => {
    try {
      await logout();
      if (wallet?.walletClientType !== "privy") {
        wallet?.disconnect();
        window.location.reload();
      }
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  return {
    handleLogout,
  };
};
