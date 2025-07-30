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
    if (ledgerService) {
      ledgerService.on(
        LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
        setPrivateBalance,
      );
      ledgerService.on(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
      return () => {
        ledgerService.off(
          LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
          setPrivateBalance,
        );
        ledgerService.off(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE, mutate);
      };
    }
  }, [ledgerService, mutate, setPrivateBalance]);

  return privateBalance;
}
