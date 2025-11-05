import { VAULT_ABI } from "./vault.abi";
import { type DepositStruct, type DepositParamsWithPermit } from "./types";
import { type Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";
import {
  FORWARDER_EXECUTION_COST,
  PROOF_VERIFICATION_GAS_COST,
  AVERAGE_ERC_20_TRANSFER_COST,
  SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST,
  PERMIT_GAS_COST,
  OUTPUT_RECORD_GAS_COST,
} from "./vault.constants";

// gas amount that should be covered by fee during sponsoring
// computes like avg tx gas limit * 1.1 + agv forwarder execution gas
export const depositWithPermitGasSponsoredLimit = (
  initializeSCWRequired: boolean,
) =>
  PROOF_VERIFICATION_GAS_COST +
  PERMIT_GAS_COST +
  AVERAGE_ERC_20_TRANSFER_COST +
  OUTPUT_RECORD_GAS_COST * 3n +
  FORWARDER_EXECUTION_COST +
  (initializeSCWRequired ? SMART_CONTRACT_WALLET_INITIALIZATION_GAS_COST : 0n);

export function getDepositWithPermitTxData(
  depositStruct: DepositStruct,
  proof: Proof,
  permitSignature: DepositParamsWithPermit["permitSignature"],
  deadline: bigint,
) {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "depositWithPermit",
    args: [
      depositStruct,
      proof,
      deadline,
      permitSignature.v,
      permitSignature.r,
      permitSignature.s,
    ],
  });
}

async function getDepositWithPermitRequest(params: DepositParamsWithPermit) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "depositWithPermit",
    args: [
      params.depositStruct,
      params.proof,
      params.deadline,
      params.permitSignature.v,
      params.permitSignature.r,
      params.permitSignature.s,
    ],
  });
  return request;
}

export async function depositWithPermit(params: DepositParamsWithPermit) {
  const txHash = await params.client.writeContract(
    await getDepositWithPermitRequest(params),
  );
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
