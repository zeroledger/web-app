import { Hex } from "viem";
import { ERC_20_WITH_PERMIT_AND_FAUCET_ABI } from "./constants";
import { CustomClient } from "@src/common.types";

export type TransferProps = {
  tokenAddress: Hex;
  receiverAddress: Hex;
  amount: bigint;
  client: CustomClient;
};

export default async function transfer(params: TransferProps) {
  const { request } = await params.client.simulateContract({
    address: params.tokenAddress,
    abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
    functionName: "transfer",
    args: [params.receiverAddress, params.amount],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
