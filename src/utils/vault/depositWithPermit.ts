import { VAULT_ABI } from "./vault.abi";
import { type DepositStruct, type DepositParamsWithPermit } from "./types";
import { type Proof } from "@src/utils/prover";
import { encodeFunctionData } from "viem";
import {
  FORWARDER_EXECUTION_COST,
  GAS_LIMIT_DENOMINATOR,
  GAS_LIMIT_NOMINATOR,
  BASE_DEPOSIT_WITH_PERMIT_GAS_COST,
} from "./vault.constants";

// gas amount that should be covered by fee during sponsoring
// computes like avg tx gas limit * 1.1 + agv forwarder execution gas
export const depositWithPermitGasSponsoredLimit = () =>
  (BASE_DEPOSIT_WITH_PERMIT_GAS_COST * GAS_LIMIT_NOMINATOR) /
    GAS_LIMIT_DENOMINATOR +
  FORWARDER_EXECUTION_COST;

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

export function getDepositWithPermitTxGas(params: DepositParamsWithPermit) {
  return params.hardcodeGas
    ? BASE_DEPOSIT_WITH_PERMIT_GAS_COST
    : params.client.estimateContractGas({
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
