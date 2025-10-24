import { Hex } from "viem";
import { ERC_20_WITH_MINT_ABI } from "./constants";
import { type CustomClient } from "@src/services/Clients";

export type AllowanceProps = {
  tokenAddress: Hex;
  ownerAddress: Hex;
  spenderAddress: Hex;
  client: CustomClient;
};

export default async function allowance(params: AllowanceProps) {
  const allowance = await params.client.readContract({
    address: params.tokenAddress,
    abi: ERC_20_WITH_MINT_ABI,
    functionName: "allowance",
    args: [params.ownerAddress, params.spenderAddress],
  });
  return allowance;
}
