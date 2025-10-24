import { EvmClients } from "@src/services/Clients";
import { metadata } from "@src/utils/erc20";
import useSWR from "swr";
import { Address } from "viem";
import { useConditionalPrevious } from "@src/hooks/usePrevious";

const fetcher = async ([evmClients, tokenAddress, address]: [
  EvmClients,
  Address,
  Address,
]) => {
  const data = await metadata({
    tokenAddress,
    client: evmClients.readClient,
    address,
  });
  return data;
};

export function useMetadata(
  tokenAddress: Address,
  address: Address,
  executeCall: boolean,
  evmClients?: EvmClients,
) {
  const {
    data: onchainWalletData,
    isLoading: isMetadataLoading,
    error: metadataError,
    mutate,
  } = useSWR(executeCall ? [evmClients, tokenAddress, address] : null, fetcher);

  const prevWalletData = useConditionalPrevious(onchainWalletData, executeCall);

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
