import { VAULT_ABI } from "./vault.abi";
import { type SpendParams, type TransactionStruct } from "./types";
import { type Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";
import {
  AVERAGE_ERC_20_TRANSFER_COST,
  FORWARDER_EXECUTION_COST,
  INPUT_REMOVAL_GAS_COST,
  OUTPUT_RECORD_GAS_COST,
  PROOF_VERIFICATION_GAS_COST,
  SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST,
} from "./vault.constants";

// gas amount that should be covered by fee during sponsoring
// computes like avg tx gas limit * 1.1 + agv forwarder execution gas
export const spendGasSponsoredLimit = (
  expectedInputs: number,
  expectedOutputs: number,
  expectedPublicOutputs: number,
  smartWalletRequireInitialization: boolean,
) => {
  const rebates = BigInt(expectedInputs) * INPUT_REMOVAL_GAS_COST;
  const writes = BigInt(expectedOutputs) * OUTPUT_RECORD_GAS_COST;
  const transfers =
    BigInt(expectedPublicOutputs + 1) * AVERAGE_ERC_20_TRANSFER_COST;
  const initialization = smartWalletRequireInitialization
    ? SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST
    : 0n;
  return (
    initialization +
    PROOF_VERIFICATION_GAS_COST +
    transfers +
    writes +
    rebates +
    FORWARDER_EXECUTION_COST
  );
};

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
