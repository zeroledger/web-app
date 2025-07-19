import { EvmClientService } from "@src/services/core/evmClient.service";
import { metadata } from "@src/utils/erc20";
import { swrKeyForClient } from "@src/utils/swrKey";
import { useCallback } from "react";
import useSWR from "swr";
import { Address } from "viem";

export function useMetadata(
  tokenAddress: Address,
  evmClientService: EvmClientService | undefined,
  connected: boolean,
) {
  const fetcher = useCallback(() => {
    if (evmClientService && connected) {
      return metadata({
        tokenAddress,
        client: evmClientService.client,
      });
    }
    return Promise.resolve(["", 0n, 0] as const);
  }, [evmClientService, connected, tokenAddress]);

  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(["/metadata", swrKeyForClient(evmClientService?.client)], fetcher);

  const [symbol, publicBalance, decimals] = onchainWalletData ?? ["", 0n, 0];

  return {
    symbol,
    publicBalance,
    decimals,
    isMetadataLoading,
    metadataError,
    mutate,
  };
}
