import { type Address } from "viem";
import { useMetadata } from "@src/hooks/erc20";

export const useMenuBalance = (token: Address) => {
  const {
    data: metadata,
    isLoading: isMetadataLoading,
    error,
  } = useMetadata(token);

  const [symbol, onchainBalance, decimals] = metadata ?? ["", 0n, 0];

  return {
    onchainBalance,
    isLoading: isMetadataLoading,
    error,
    symbol,
    decimals,
  };
};
