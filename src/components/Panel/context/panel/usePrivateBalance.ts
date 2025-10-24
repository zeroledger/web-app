import { useEffect, useState } from "react";
import { type Ledger, LedgerEvents } from "@src/services/ledger";
import { type KeyedMutator } from "swr";

export function usePrivateBalance(
  updateOnchainBalance: KeyedMutator<readonly [string, bigint, number]>,
  ledger?: Ledger,
) {
  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  useEffect(() => {
    const setter = (value: bigint) => {
      setPrivateBalance(value);
    };
    ledger?.watcher.on(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
    ledger?.watcher.on(
      LedgerEvents.ONCHAIN_BALANCE_CHANGE,
      updateOnchainBalance,
    );
    return () => {
      ledger?.watcher.off(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
      ledger?.watcher.off(
        LedgerEvents.ONCHAIN_BALANCE_CHANGE,
        updateOnchainBalance,
      );
    };
  }, [ledger, updateOnchainBalance, setPrivateBalance]);

  return privateBalance;
}
