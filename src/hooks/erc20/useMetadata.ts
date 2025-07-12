import { useContext, useCallback, useEffect } from "react";
import { Address } from "viem";
import useSWR from "swr";
import { metadata } from "@src/utils/erc20";
import { ClientContext } from "@src/context/client.context";
import { swrKeyForClient } from "@src/utils/swrKey";
import { ControllerContext } from "@src/context/controller.context";
import { ClientServiceEvents } from "@src/services/client.controller";

export default function useMetadata(token: Address) {
  const { client } = useContext(ClientContext);
  const { clientController } = useContext(ControllerContext);

  const fetcher = useCallback(
    async () =>
      metadata({
        tokenAddress: token,
        client,
      }),
    [client, token],
  );

  const result = useSWR(["/metadata", swrKeyForClient(client)], fetcher);

  useEffect(() => {
    clientController?.on(
      ClientServiceEvents.ONCHAIN_BALANCE_CHANGE,
      result.mutate,
    );
    return () => {
      clientController?.off(
        ClientServiceEvents.ONCHAIN_BALANCE_CHANGE,
        result.mutate,
      );
    };
  }, [clientController, result.mutate]);

  return result;
}
