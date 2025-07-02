import { WITHDRAW_EXTENSION_ABI } from "./withdraw.extension.abi";
import { CustomClient } from "@src/common.types";
import { Address } from "viem";

export type WithdrawItem = {
  amount: bigint;
  sValue: bigint;
};

export type WithdrawParams = {
  client: CustomClient;
  contract: Address;
  token: Address;
  withdrawItems: WithdrawItem[];
};

export default async function withdrawBatch(params: WithdrawParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: WITHDRAW_EXTENSION_ABI,
    functionName: "withdrawBatch",
    args: [params.token, params.withdrawItems],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
