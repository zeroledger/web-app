import { useContext, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";

export const useLogout = () => {
  const { logout, wallet } = useContext(LedgerContext);

  const handleLogout = useCallback(async () => {
    try {
      if (wallet?.walletClientType !== "privy") {
        await logout();
      }
      wallet?.disconnect();
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, [logout, wallet]);

  return {
    handleLogout,
  };
};
