import { EvmClients } from "@src/services/Clients";
import { metadata } from "@src/utils/erc20";
import useSWR from "swr";
import { Address } from "viem";
import { useConditionalPrevious } from "./usePrevious";

const fetcher = async ([evmClients, tokenAddress]: [EvmClients, Address]) => {
  const externalClient = await evmClients.externalClient();
  const data = await metadata({
    tokenAddress,
    client: externalClient,
  });
  return data;
};

export function useMetadata(
  tokenAddress: Address,
  isWalletChanged: boolean,
  isChainSupported: boolean,
  evmClients?: EvmClients,
) {
  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(isChainSupported ? [evmClients, tokenAddress] : null, fetcher);

  const prevWalletData = useConditionalPrevious(
    onchainWalletData,
    isChainSupported,
  );

  const [symbol, publicBalance, decimals] = onchainWalletData ??
    prevWalletData ?? ["", 0n, 0];

  return {
    symbol,
    publicBalance,
    decimals,
    isMetadataLoading,
    metadataError,
    mutate,
  };
}
