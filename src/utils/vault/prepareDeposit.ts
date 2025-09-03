import { generatePrivateKey } from "viem/accounts";
import { Address, Hex } from "viem";
import { prover } from "@src/utils/prover";
import {
  DepositCommitmentData,
  DepositCommitmentParamsStruct,
  DepositData,
  DepositProofData,
  DepositStruct,
} from "./types";
import { shuffle } from "@src/utils/common";
import { encode } from "./metadata";

async function createDepositStruct(
  token: Address,
  data: DepositData,
  depositCommitmentData: DepositCommitmentData,
): Promise<DepositStruct> {
  return {
    token,
    amount: data.valueLeftForUser,
    depositCommitmentParams: depositCommitmentData.depositCommitmentParams,
    forwarderFee: data.forwarderFee,
    forwarderFeeRecipient: data.forwarderFeeRecipient,
  };
}

async function generateDepositCommitmentData(
  individualAmounts: bigint[],
  userAddress: Address,
  userEncryptionPublicKey: Hex,
  tesUrl: string,
): Promise<DepositCommitmentData> {
  const amounts: bigint[] = [];
  const sValues: bigint[] = [];
  const hashes: bigint[] = [];

  for (let i = 0; i < 3; i++) {
    const sValue = BigInt(generatePrivateKey());
    sValues.push(sValue);
    amounts.push(individualAmounts[i]);
    const { computePoseidon } = await import("@src/utils/poseidon");
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
      metadata: encode(
        { amount: amounts[0], sValue: sValues[0] },
        tesUrl,
        userEncryptionPublicKey,
      ),
    },
    {
      poseidonHash: hashes[1],
      owner: userAddress,
      metadata: encode(
        { amount: amounts[1], sValue: sValues[1] },
        tesUrl,
        userEncryptionPublicKey,
      ),
    },
    {
      poseidonHash: hashes[2],
      owner: userAddress,
      metadata: encode(
        { amount: amounts[2], sValue: sValues[2] },
        tesUrl,
        userEncryptionPublicKey,
      ),
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
  user: Address,
  value: bigint,
  userEncryptionPublicKey: Hex,
  protocolDepositFee: bigint,
  forwarderFee: bigint,
  forwarderFeeRecipient: Address,
  tesUrl = "",
) {
  const valueLeftForUser = value - protocolDepositFee - forwarderFee;
  const random = BigInt(Math.ceil(Math.random() * 3));
  const firstAmount = valueLeftForUser / random;
  const secondAmount = valueLeftForUser - firstAmount;
  const depositData: DepositData = {
    valueLeftForUser,
    individualAmounts: shuffle([firstAmount, secondAmount, 0n]),
    user,
    protocolDepositFee,
    forwarderFee,
    forwarderFeeRecipient,
  };

  const depositCommitmentData = await generateDepositCommitmentData(
    depositData.individualAmounts,
    depositData.user,
    userEncryptionPublicKey,
    tesUrl,
  );

  const proofData = await generateDepositProof(
    depositCommitmentData.hashes,
    depositData.valueLeftForUser,
    depositCommitmentData.amounts,
    depositCommitmentData.sValues,
  );

  const depositStruct = await createDepositStruct(
    token,
    depositData,
    depositCommitmentData,
  );

  return {
    proofData,
    depositStruct,
    depositCommitmentData,
  };
}
