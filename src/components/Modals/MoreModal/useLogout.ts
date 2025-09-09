import { useContext, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";

export const useLogout = () => {
  const { logout } = useContext(LedgerContext);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.log("error");
      catchService.catch(error as Error);
    }
  }, [logout]);

  return {
    handleLogout,
  };
};
