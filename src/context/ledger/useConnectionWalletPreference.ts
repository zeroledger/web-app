import {
  setConnectionWalletPreference as setStoredPref,
  getConnectionWalletPreference as getStoredPref,
  resetConnectionWalletPreference as resetStoredPref,
} from "@src/services/connectionWalletPreference";
import { useCallback, useState } from "react";

export function useConnectionWalletPreference() {
  const [preference, setPreference] = useState<boolean | null>(getStoredPref());

  const setConnectionWalletPreference = useCallback((v: boolean) => {
    setPreference(v);
    setStoredPref(v);
  }, []);

  const resetConnectionWalletPreference = useCallback(() => {
    setPreference(null);
    resetStoredPref();
  }, []);

  return {
    connectionWalletPreference: preference,
    setConnectionWalletPreference,
    resetConnectionWalletPreference,
  };
}
