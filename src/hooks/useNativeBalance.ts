import { useContext, useCallback } from "react";
import useSWR from "swr";
import { swrKeyForClient } from "@src/utils/swrKey";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";

export default function useNativeBalance() {
  const { evmClientService } = useContext(EvmClientsContext);
  const fetcher = useCallback(async () => {
    if (evmClientService) {
      return evmClientService.readClient!.getBalance({
        address: evmClientService!.writeClient!.account.address,
      });
    }
    return 0n;
  }, [evmClientService]);
  return useSWR(
    ["/balance", swrKeyForClient(evmClientService!.writeClient)],
    fetcher,
  );
}
