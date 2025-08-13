import { useEffect, useState } from "react";
import { type Ledger, LedgerEvents } from "@src/services/ledger";
import { useMetadata } from "@src/hooks/useMetadata";
import { type EvmClients } from "@src/services/Clients";
import { type Address } from "viem";

export function usePrivateBalance(
  tokenAddress: Address,
  isWalletChanged: boolean,
  isChainSupported: boolean,
  ledger?: Ledger,
  evmClients?: EvmClients,
) {
  const { mutate } = useMetadata(
    tokenAddress,
    isWalletChanged,
    isChainSupported,
    evmClients,
  );

  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  useEffect(() => {
    const setter = (value: bigint) => {
      setPrivateBalance(value);
    };
    ledger?.on(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
    ledger?.on(LedgerEvents.ONCHAIN_BALANCE_CHANGE, mutate);
    return () => {
      ledger?.off(LedgerEvents.PRIVATE_BALANCE_CHANGE, setter);
      ledger?.off(LedgerEvents.ONCHAIN_BALANCE_CHANGE, mutate);
    };
  }, [ledger, mutate, setPrivateBalance]);

  return privateBalance;
}
