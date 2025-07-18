import { Address, Hex } from "viem";
import { ERC_20_WITH_MINT_ABI } from "./constants";
import { type CustomClient } from "@src/services/core/evmClient.service";

export type ERC20MetadataParams = {
  tokenAddress: Hex;
  client: CustomClient;
  address?: Address;
};

export default async function metadata(params: ERC20MetadataParams) {
  const contract = {
    address: params.tokenAddress,
    abi: ERC_20_WITH_MINT_ABI,
  };

  const [symbol, amount, decimals] = await params.client.multicall({
    contracts: [
      {
        ...contract,
        functionName: "symbol",
      },
      {
        ...contract,
        functionName: "balanceOf",
        args: [params.address ?? params.client.account.address],
      },
      {
        ...contract,
        functionName: "decimals",
      },
    ],
  });

  return [symbol.result!, amount.result!, decimals.result!] as const;
}
