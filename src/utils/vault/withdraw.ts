import { zeroAddress } from "viem";
import { VAULT_ABI } from "./vault.abi";
import { WithdrawParams } from "./types";

export default async function withdraw(params: WithdrawParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [
      params.token,
      params.withdrawItems,
      params.recipient,
      0n,
      zeroAddress,
    ],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
