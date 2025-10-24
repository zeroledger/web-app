import { Address, Log, PublicClient } from "viem";
import { INVOICE_ABI_EVENTS } from "./invoice.abi";
import { type Proof } from "../prover";
import { type DepositCommitmentParamsStruct } from "@src/utils/vault";

export type InvoiceEvent = Log<
  bigint,
  number,
  boolean,
  (typeof INVOICE_ABI_EVENTS)[number],
  undefined,
  typeof INVOICE_ABI_EVENTS
>;

export type DeployAndProcessInvoiceParams = {
  client: PublicClient;
  invoiceFactory: Address;
  paymaster: Address;
  vault: Address;
  token: Address;
  amount: bigint;
  executionFee: bigint;
  commitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ];
  proof: Proof;
};
