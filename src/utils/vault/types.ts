import { CustomClient } from "@src/common.types";
import { Address, Hex, Log } from "viem";
import { Proof } from "@src/utils/prover";
import { VAULT_ABI_EVENTS } from "./vault.abi";

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

export type DepositCommitmentData = {
  amounts: bigint[];
  sValues: bigint[];
  hashes: bigint[];
  depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
};

export type SpendInput = {
  input_amounts: bigint[];
  input_sValues: bigint[];
  inputs_hashes: bigint[];
  output_amounts: bigint[];
  output_sValues: bigint[];
  outputs_hashes: bigint[];
  fee: bigint;
};

export type SpendParams = {
  transactionStruct: TransactionStruct;
  client: CustomClient;
  contract: Address;
  proof: Proof;
};

export type OutputsOwnersStruct = {
  owner: Address;
  indexes: number[];
};

export type TransactionStruct = {
  token: Address;
  inputsPoseidonHashes: bigint[];
  outputsPoseidonHashes: bigint[];
  encryptedData: Hex[];
  outputsOwners: OutputsOwnersStruct[];
  publicOutputs: PublicOutput[];
};

export type PublicOutput = {
  amount: bigint;
  owner: Address;
};

export type CommitmentStruct = {
  amount: bigint;
  sValue: bigint;
};

export type WithdrawParams = {
  client: CustomClient;
  contract: Address;
  token: Address;
  withdrawItems: CommitmentStruct[];
  recipient: Address;
};

export type VaultEvent = Log<
  bigint,
  number,
  boolean,
  (typeof VAULT_ABI_EVENTS)[number],
  undefined,
  typeof VAULT_ABI_EVENTS
>;

export type SelectedCommitmentRecord = {
  value: bigint;
  sValue: bigint;
  hash: bigint;
};
