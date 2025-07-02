import { randomBytes } from "@noble/hashes/utils";
import { CustomClient } from "@src/common.types";
import { computePoseidon } from "@src/utils/poseidon";
import { Address, toHex, zeroAddress } from "viem";
import { prover } from "@src/utils/prover";
import {
  CommitmentData,
  DepositCommitmentParamsStruct,
  DepositData,
  DepositProofData,
  DepositStruct,
} from "./types";
import { shuffle } from "@src/utils/common";

export const mockEncryptedData = toHex(randomBytes(32));

async function createDepositStruct(
  token: Address,
  data: DepositData,
  commitmentData: CommitmentData,
): Promise<DepositStruct> {
  return {
    token,
    total_deposit_amount: data.depositAmount,
    depositCommitmentParams: commitmentData.depositCommitmentParams,
    fee: data.fee,
    feeRecipient: data.feeRecipient,
  };
}

async function generateCommitmentData(
  individualAmounts: bigint[],
  userAddress: Address,
): Promise<CommitmentData> {
  const amounts: bigint[] = [];
  const sValues: bigint[] = [];
  const hashes: bigint[] = [];

  for (let i = 0; i < 3; i++) {
    const sValue = BigInt(toHex(randomBytes(32)));
    sValues.push(sValue);
    amounts.push(individualAmounts[i]);

    const hash = await computePoseidon({
      amount: individualAmounts[i],
      entropy: sValue,
    });
    hashes.push(hash);
  }

  const depositCommitmentParams: [
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
    DepositCommitmentParamsStruct,
  ] = [
    {
      poseidonHash: hashes[0],
      owner: userAddress,
      encryptedData: mockEncryptedData,
    },
    {
      poseidonHash: hashes[1],
      owner: userAddress,
      encryptedData: mockEncryptedData,
    },
    {
      poseidonHash: hashes[2],
      owner: userAddress,
      encryptedData: mockEncryptedData,
    },
  ];

  return { amounts, sValues, hashes, depositCommitmentParams };
}

export async function generateDepositProof(
  hashes: bigint[],
  totalAmount: bigint,
  amounts: bigint[],
  sValues: bigint[],
): Promise<DepositProofData> {
  const proofInput = {
    hashes,
    totalAmount,
    amounts,
    sValues,
  };

  const { proof, publicSignals } = await prover.runPlonkProof(
    "deposit",
    proofInput,
  );
  const { calldata_proof } = await prover.exportSolidityCallData(
    proof,
    publicSignals,
  );

  return { proofInput, calldata_proof };
}

export default async function prepareDeposit(
  token: Address,
  client: CustomClient,
  value: bigint,
) {
  const firstAmount = value / 2n;
  const secondAmount = value - firstAmount;
  const depositData: DepositData = {
    depositAmount: value,
    fee: 0n,
    individualAmounts: shuffle([firstAmount, secondAmount, 0n]),
    user: client.account.address,
    feeRecipient: zeroAddress,
  };

  const commitmentData = await generateCommitmentData(
    depositData.individualAmounts,
    depositData.user,
  );

  const proofData = await generateDepositProof(
    commitmentData.hashes,
    depositData.depositAmount,
    commitmentData.amounts,
    commitmentData.sValues,
  );

  const depositStruct = await createDepositStruct(
    token,
    depositData,
    commitmentData,
  );

  return {
    proofData,
    depositStruct,
    commitmentData,
  };
}
