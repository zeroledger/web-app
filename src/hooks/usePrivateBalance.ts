import { useEffect, useState } from "react";
import { type LedgerService, LedgerServiceEvents } from "@src/services/ledger";
import { useMetadata } from "./useMetadata";
import { type EvmClientService } from "@src/services/core/evmClient.service";
import { type Address } from "viem";

export function usePrivateBalance(
  tokenAddress: Address,
  ledgerService?: LedgerService,
  evmClientService?: EvmClientService,
) {
  const { mutate } = useMetadata(tokenAddress, evmClientService);

  const [privateBalance, setPrivateBalance] = useState<bigint>(0n);
  useEffect(() => {
    const setter = (value: bigint) => {
      console.log(`[zeroledger-app]: setBalance(${value.toString()})`);
      setPrivateBalance(value);
    };
    ledgerService?.on(LedgerServiceEvents.PRIVATE_BALANCE_CHANGE, setter);
    ledgerService?.on(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
    return () => {
      ledgerService?.off(LedgerServiceEvents.PRIVATE_BALANCE_CHANGE, setter);
      ledgerService?.off(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
    };
  }, [ledgerService, mutate, setPrivateBalance]);

  return privateBalance;
}
