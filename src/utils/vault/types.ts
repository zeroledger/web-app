import { type Address, type Hex, type Log } from "viem";
import { type Proof } from "@src/utils/prover";
import { VAULT_ABI_EVENTS } from "./vault.abi";
import { type CustomClient } from "@src/services/Clients";

export type DepositCommitmentParamsStruct = {
  poseidonHash: bigint;
  owner: Address;
  metadata: Hex;
};

export type DepositStruct = {
  token: Address;
  amount: bigint;
  depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
  forwarderFee: bigint;
  forwarderFeeRecipient: Address;
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
  valueLeftForUser: bigint;
  protocolDepositFee: bigint;
  forwarderFee: bigint;
  individualAmounts: bigint[];
  user: Address;
  forwarderFeeRecipient: Address;
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
  metadata: Hex[];
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
  withdrawRecipients: {
    recipient: Address;
    amount: bigint;
  }[];
};

export type VaultEvent = Log<
  bigint,
  number,
  boolean,
  (typeof VAULT_ABI_EVENTS)[number],
  undefined,
  typeof VAULT_ABI_EVENTS
>;

export type VaultCommitmentCreatedEvent = Log<
  bigint,
  number,
  boolean,
  NonNullable<(typeof VAULT_ABI_EVENTS)[number]>,
  undefined,
  typeof VAULT_ABI_EVENTS,
  "CommitmentCreated"
>;

export type VaultCommitmentRemovedEvent = Log<
  bigint,
  number,
  boolean,
  NonNullable<(typeof VAULT_ABI_EVENTS)[number]>,
  undefined,
  typeof VAULT_ABI_EVENTS,
  "CommitmentRemoved"
>;

export type SelectedCommitmentRecord = {
  value: bigint;
  sValue: bigint;
  hash: bigint;
};

export type DecoyParams = {
  address: Address;
  publicKey: Hex;
} | null;
