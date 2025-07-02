import { CustomClient } from "@src/common.types";
import { Address, Hex } from "viem";

export type DepositCommitmentParamsStruct = {
  poseidonHash: string;
  owner: Address;
  encryptedData: Hex;
};

export type DepositStruct = {
  token: Address;
  total_deposit_amount: bigint;
  depositCommitmentParams: DepositCommitmentParamsStruct[];
  fee: bigint;
  feeRecipient: Address;
};

export type DepositParams = {
  depositStruct: DepositStruct;
  client: CustomClient;
  contract: Address;
  proof: BigIntString[];
};

export type DepositProofData = {
  proofInput: {
    hashes: BigIntString[];
    totalAmount: BigIntString;
    amounts: BigIntString[];
    sValues: BigIntString[];
  };
  calldata_proof: BigIntString[];
};

export type DepositData = {
  depositAmount: bigint;
  fee: bigint;
  individualAmounts: bigint[];
  user: Address;
  feeRecipient: Address;
};

export type CommitmentData = {
  amounts: BigIntString[];
  sValues: BigIntString[];
  hashes: BigIntString[];
  depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
};
