import { Address, Hex } from "viem";
import { CustomClient } from "@src/common.types";
import { ERC_20_WITH_MINT_ABI } from "./constants";

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
