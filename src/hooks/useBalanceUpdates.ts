import { useEffect } from "react";
import { LedgerService, LedgerServiceEvents } from "@src/services/ledger";
import { KeyedMutator } from "swr";

export function useBalanceUpdates(
  ledgerServices:
    | {
        ledgerService: LedgerService;
      }
    | undefined,
  connected: boolean,
  setPrivateBalance: React.Dispatch<React.SetStateAction<bigint>>,
  mutate: KeyedMutator<readonly [string, bigint, number]>,
) {
  useEffect(() => {
    if (ledgerServices && connected) {
      ledgerServices.ledgerService.on(
        LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
        setPrivateBalance,
      );
      ledgerServices.ledgerService.on(
        LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE,
        mutate,
      );
      return () => {
        ledgerServices.ledgerService.off(
          LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
          setPrivateBalance,
        );
        ledgerServices.ledgerService.off(
          LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE,
          mutate,
        );
      };
    }
  }, [ledgerServices, connected, mutate, setPrivateBalance]);
}
