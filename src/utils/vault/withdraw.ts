import { encodeFunctionData } from "viem";
import { VAULT_ABI } from "./vault.abi";
import { type WithdrawParams } from "./types";
import {
  AVERAGE_ERC_20_TRANSFER_COST,
  FORWARDER_EXECUTION_COST,
  REDEEM_ITEM_GAS_COST,
  SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST,
} from "./vault.constants";

// gas amount that should be covered by fee during sponsoring
// computes like avg tx gas limit * 1.1 + agv forwarder execution gas
export const withdrawGasSponsoredLimit = (
  withdrawingItemsAmount: number,
  smartWalletRequireInitialization: boolean,
) =>
  BigInt(withdrawingItemsAmount) * REDEEM_ITEM_GAS_COST +
  (smartWalletRequireInitialization
    ? SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST
    : 0n) +
  AVERAGE_ERC_20_TRANSFER_COST * 3n +
  FORWARDER_EXECUTION_COST;

export function getWithdrawTxData(params: WithdrawParams) {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [params.token, params.withdrawItems, params.withdrawRecipients],
  });
}

export function getWithdrawTxGas(params: WithdrawParams) {
  return params.client.estimateContractGas({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [params.token, params.withdrawItems, params.withdrawRecipients],
  });
}

export async function getWithdrawRequest(params: WithdrawParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [params.token, params.withdrawItems, params.withdrawRecipients],
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
