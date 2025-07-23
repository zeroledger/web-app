import { VAULT_ABI } from "./vault.abi";
import { SpendParams, TransactionStruct } from "./types";
import { Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";

export function getSpendTxData(
  transactionStruct: TransactionStruct,
  proof: Proof,
) {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "spend",
    args: [transactionStruct, proof],
  });
}

export function getSpendTxGas(params: SpendParams) {
  return params.client.estimateContractGas({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "spend",
    args: [params.transactionStruct, params.proof],
  });
}

export async function getSpendRequest(params: SpendParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "spend",
    args: [params.transactionStruct, params.proof],
  });
  return request;
}

export async function spend(params: SpendParams) {
  const txHash = await params.client.writeContract(
    await getSpendRequest(params),
  );
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
