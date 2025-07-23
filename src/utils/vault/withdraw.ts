import { encodeFunctionData, zeroAddress } from "viem";
import { VAULT_ABI } from "./vault.abi";
import { WithdrawParams } from "./types";

export function getWithdrawTxData(params: WithdrawParams) {
  return encodeFunctionData({
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
}

export function getWithdrawTxGas(params: WithdrawParams) {
  return params.client.estimateContractGas({
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
}

export async function getWithdrawRequest(params: WithdrawParams) {
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
  return request;
}

export async function withdraw(params: WithdrawParams) {
  const txHash = await params.client.writeContract(
    await getWithdrawRequest(params),
  );
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
