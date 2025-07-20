import { useContext, useCallback } from "react";
import useSWR from "swr";
import { LedgerContext } from "@src/context/ledger.context";
import { accountService } from "@src/services/ledger/accounts.service";
import { swrKeyForClient } from "@src/utils/swrKey";

export default function useNativeBalance() {
  const { ledgerServices, connected } = useContext(LedgerContext);
  const fetcher = useCallback(async () => {
    if (ledgerServices && connected) {
      return ledgerServices.evmClientService.client.getBalance({
        address: accountService.getMainAccount()!.address,
      });
    }
    return 0n;
  }, [ledgerServices, connected]);
  return useSWR(
    ["/balance", swrKeyForClient(ledgerServices?.evmClientService.client)],
    fetcher,
  );
}
