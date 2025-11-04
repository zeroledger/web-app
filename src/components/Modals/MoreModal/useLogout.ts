import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";
import { useContext } from "react";

export const useLogout = () => {
  const { logout } = useContext(LedgerContext);

  const handleLogout = debounce(async () => {
    try {
      await logout();
      window.location.reload();
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  return {
    handleLogout,
  };
};
