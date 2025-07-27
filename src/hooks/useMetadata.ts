import { EvmClientService } from "@src/services/core/evmClient.service";
import { metadata } from "@src/utils/erc20";
import { swrKeyForClient } from "@src/utils/swrKey";
import { useCallback } from "react";
import useSWR from "swr";
import { Address } from "viem";

export function useMetadata(
  tokenAddress: Address,
  evmClientService?: EvmClientService,
) {
  const fetcher = useCallback(() => {
    if (evmClientService) {
      return metadata({
        tokenAddress,
        client: evmClientService.writeClient!,
      });
    }
    return Promise.resolve(["", 0n, 0] as const);
  }, [evmClientService, tokenAddress]);

  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(
    ["/metadata", swrKeyForClient(evmClientService?.writeClient)],
    fetcher,
  );

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
