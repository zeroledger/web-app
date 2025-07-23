import { VAULT_ABI } from "./vault.abi";
import type { DepositParams, DepositStruct } from "./types";
import type { Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";

export function getDepositTxData(depositStruct: DepositStruct, proof: Proof) {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [depositStruct, proof],
  });
}

export function getDepositTxGas(params: DepositParams) {
  return params.client.estimateContractGas({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [params.depositStruct, params.proof],
  });
}

export async function getDepositRequest(params: DepositParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [params.depositStruct, params.proof],
  });
  return request;
}

export async function deposit(params: DepositParams) {
  const txHash = await params.client.writeContract(
    await getDepositRequest(params),
  );
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
