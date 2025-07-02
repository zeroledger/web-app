import { CustomClient } from "@src/common.types";
import { Address, Hex } from "viem";
import { Proof } from "@src/utils/prover";

export type DepositCommitmentParamsStruct = {
  poseidonHash: bigint;
  owner: Address;
  encryptedData: Hex;
};

export type DepositStruct = {
  token: Address;
  total_deposit_amount: bigint;
  depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
  fee: bigint;
  feeRecipient: Address;
};

export type DepositParams = {
  depositStruct: DepositStruct;
  client: CustomClient;
  contract: Address;
  proof: Proof;
};

export type DepositProofData = {
  proofInput: {
    hashes: bigint[];
    totalAmount: bigint;
    amounts: bigint[];
    sValues: bigint[];
  };
  calldata_proof: Proof;
};

export type DepositData = {
  depositAmount: bigint;
  fee: bigint;
  individualAmounts: bigint[];
  user: Address;
  feeRecipient: Address;
};

export type CommitmentData = {
  amounts: bigint[];
  sValues: bigint[];
  hashes: bigint[];
  depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
};
