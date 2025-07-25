import { useContext, useCallback } from "react";
import useSWR from "swr";
import { LedgerContext } from "@src/context/ledger.context";
import { swrKeyForClient } from "@src/utils/swrKey";

export default function useNativeBalance() {
  const { ledgerServices, initialized } = useContext(LedgerContext);
  const fetcher = useCallback(async () => {
    if (ledgerServices && initialized) {
      return ledgerServices.evmClientService.readClient!.getBalance({
        address: ledgerServices.evmClientService.writeClient!.account.address,
      });
    }
    return 0n;
  }, [ledgerServices, initialized]);
  return useSWR(
    ["/balance", swrKeyForClient(ledgerServices?.evmClientService.writeClient)],
    fetcher,
  );
}
