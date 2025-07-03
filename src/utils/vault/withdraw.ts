import { CustomClient } from "@src/common.types";
import { Address } from "viem";
import { VAULT_ABI } from "./vault.abi";

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

export default async function withdraw(params: WithdrawParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [params.token, params.withdrawItems],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
