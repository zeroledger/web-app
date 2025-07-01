import { useContext, useCallback } from "react";
import useSWR from "swr";
import { ClientContext } from "@src/context/client.context";
import { swrKeyForClient } from "@src/utils/swrKey";

export default function useNativeBalance() {
  const { client } = useContext(ClientContext);
  const fetcher = useCallback(
    async () => client.getBalance({ address: client.account.address }),
    [client],
  );
  return useSWR(["/balance", swrKeyForClient(client)], fetcher);
}
