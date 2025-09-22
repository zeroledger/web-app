import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useLogout = () => {
  const { logout, wallet } = useContext(LedgerContext);

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
