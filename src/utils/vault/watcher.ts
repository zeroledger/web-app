import { Log } from "viem";
import { Address } from "viem";
import { VAULT_ABI_EVENTS } from "./vault.abi";
import { VaultEvent } from "./types";
import { format } from "../common";
import { CustomClient } from "@src/common.types";

export const watchVault = (
  client: CustomClient,
  contractAddress: Address,
  subscriber: (events: VaultEvent[]) => void | Promise<void>,
  pollingInterval = 5_000,
) => {
  const unwatch = client.watchContractEvent({
    address: contractAddress,
    abi: VAULT_ABI_EVENTS,
    onLogs: (events: Log[]) => subscriber(format(events) as VaultEvent[]),
    pollingInterval,
  });
  return unwatch;
};
