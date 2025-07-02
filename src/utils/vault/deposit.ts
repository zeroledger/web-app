import { Hex, type Address } from "viem";
import { VAULT_ABI } from "./vault.abi";
import { CustomClient } from "@src/common.types";

export interface DepositCommitmentParamsStruct {
  poseidonHash: string;
  owner: Address;
  encryptedData: Hex;
}

type DepositParamsStruct = {
  token: Address;
  total_deposit_amount: bigint;
  depositCommitmentParams: DepositCommitmentParamsStruct[];
  fee: bigint;
  feeRecipient: Address;
};

type DepositParams = {
  depositStruct: DepositParamsStruct;
  client: CustomClient;
  contract: Address;
  proof: string[];
};

export default async function deposit(params: DepositParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [params.depositStruct, params.proof],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
