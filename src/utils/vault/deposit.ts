import { VAULT_ABI } from "./vault.abi";
import { type DepositParams, type DepositStruct } from "./types";
import { type Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";
import {
  FORWARDER_EXECUTION_COST,
  PROOF_VERIFICATION_GAS_COST,
  AVERAGE_ERC_20_TRANSFER_COST,
  OUTPUT_RECORD_GAS_COST,
} from "./vault.constants";

// gas amount that should be covered by fee during sponsoring
// computes like avg tx gas limit * 1.1 + agv forwarder execution gas
export const depositGasSponsoredLimit = () =>
  PROOF_VERIFICATION_GAS_COST +
  AVERAGE_ERC_20_TRANSFER_COST +
  OUTPUT_RECORD_GAS_COST * 3n +
  FORWARDER_EXECUTION_COST;

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

async function getDepositRequest(params: DepositParams) {
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
