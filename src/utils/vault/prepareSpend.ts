import { randomBytes } from "@noble/hashes/utils";
import { computePoseidon } from "@src/utils/poseidon";
import { CircuitType, getCircuitType, prover } from "@src/utils/prover";
import { Address, toHex } from "viem";
import {
  SpendInput,
  TransactionStruct,
  OutputsOwnersStruct,
  PublicOutput,
} from "./types";
import { DecoyRecordDto } from "@src/services/client/records.entity";
import { logStringify } from "../common";

export const mockEncryptedData = toHex(randomBytes(2));

function findCommitments(commitments: DecoyRecordDto[], amount: bigint) {
  // Sort commitments by amount in descending order
  const sortedCommitments = [...commitments]
    .map((c) => ({
      amount: BigInt(c.value),
      sValue: BigInt(c.sValue),
      hash: BigInt(c.hash),
    }))
    .sort((a, b) => {
      if (a.amount === b.amount) {
        return 0;
      }
      return a.amount > b.amount ? -1 : 1;
    });

  let selectedCommitments: Array<{
    amount: bigint;
    sValue: bigint;
    hash: bigint;
  }> = [];

  let i = 0;
  let accumulatedAmount = 0n;

  while (i < sortedCommitments.length && accumulatedAmount < amount) {
    accumulatedAmount = 0n;
    selectedCommitments = [];
    for (let j = i; j < 3; j++) {
      if (accumulatedAmount >= amount) {
        break;
      }
      accumulatedAmount += sortedCommitments[j].amount;
      selectedCommitments.push(sortedCommitments[j]);
    }
    i++;
  }

  return {
    selectedCommitments,
    totalAmount: accumulatedAmount,
  };
}

async function createOutputs(amount: bigint, totalInputAmount: bigint) {
  const hasChange = totalInputAmount > amount;
  const changeAmount = hasChange ? totalInputAmount - amount : 0n;

  const outputHashes: bigint[] = [];
  const outputAmounts: bigint[] = [];
  const outputSValues: bigint[] = [];

  const receiverSValue = BigInt(toHex(randomBytes(32)));
  const receiverHash = await computePoseidon({
    amount,
    entropy: receiverSValue,
  });

  outputHashes.push(receiverHash);
  outputAmounts.push(amount);
  outputSValues.push(receiverSValue);

  // Create change output if needed
  if (hasChange) {
    const changeSValue = BigInt(toHex(randomBytes(32)));
    const changeHash = await computePoseidon({
      amount: changeAmount,
      entropy: changeSValue,
    });

    outputHashes.push(changeHash);
    outputAmounts.push(changeAmount);
    outputSValues.push(changeSValue);
  }

  return {
    outputHashes,
    outputAmounts,
    outputSValues,
  };
}

async function generateSpendProof(
  circuitType: CircuitType,
  proofInput: SpendInput,
) {
  const { proof, publicSignals } = await prover.runPlonkProof(
    circuitType,
    proofInput,
  );

  const { calldata_proof } = await prover.exportSolidityCallData(
    proof,
    publicSignals,
  );

  return { calldata_proof };
}

function createTransactionStruct(
  token: Address,
  inputHashes: bigint[],
  outputHashes: bigint[],
  spender: Address,
  receiver: Address,
  publicOutputs: PublicOutput[],
): TransactionStruct {
  const outputsOwners: OutputsOwnersStruct[] = [
    {
      owner: receiver,
      indexes: [0],
    },
  ];

  if (outputHashes.length > 1) {
    outputsOwners.push({
      owner: spender,
      indexes: [1],
    });
  }

  return {
    token,
    inputsPoseidonHashes: inputHashes,
    outputsPoseidonHashes: outputHashes,
    encryptedData: outputHashes.map(() => mockEncryptedData),
    outputsOwners,
    publicOutputs,
  };
}

export default async function prepareSpend(
  commitments: DecoyRecordDto[],
  token: Address,
  amount: bigint,
  spender: Address,
  receiver: Address,
  publicOutputs: PublicOutput[],
) {
  const publicOutputsAmount = publicOutputs.reduce(
    (acc, curr) => acc + curr.amount,
    0n,
  );

  const { selectedCommitments, totalAmount } = findCommitments(
    commitments,
    amount + publicOutputsAmount,
  );

  console.log(
    `selectedCommitments: ${logStringify(selectedCommitments)} with totalAmount: ${totalAmount}`,
  );

  if (selectedCommitments.length === 0) {
    throw new Error("No commitments found to cover the requested amount");
  }

  const { outputHashes, outputAmounts, outputSValues } = await createOutputs(
    amount,
    totalAmount - publicOutputsAmount,
  );

  const proofInput = {
    input_amounts: selectedCommitments.map((c) => c.amount),
    input_sValues: selectedCommitments.map((c) => c.sValue),
    inputs_hashes: selectedCommitments.map((c) => c.hash),
    output_amounts: outputAmounts,
    output_sValues: outputSValues,
    outputs_hashes: outputHashes,
    fee: publicOutputsAmount,
  };

  const circuitType = getCircuitType(
    selectedCommitments.length,
    outputHashes.length,
  );

  console.log(
    `circuitType: ${circuitType} with proofInput: ${logStringify(proofInput)}`,
  );

  const { calldata_proof } = await generateSpendProof(circuitType, proofInput);

  const transactionStruct = createTransactionStruct(
    token,
    proofInput.inputs_hashes,
    outputHashes,
    spender,
    receiver,
    publicOutputs,
  );

  return {
    proofData: {
      proofInput,
      calldata_proof,
    },
    transactionStruct,
  };
}
