import { randomBytes } from "@noble/hashes/utils";
import { computePoseidon } from "@src/utils/poseidon";
import { CircuitType, getCircuitType, prover } from "@src/utils/prover";
import { Address, toHex } from "viem";
import {
  SpendInput,
  TransactionStruct,
  OutputsOwnersStruct,
  PublicOutput,
  SelectedCommitmentRecord,
} from "./types";
import { logStringify } from "../common";
import { encrypt } from "./encryption";

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
  outputAmounts: bigint[],
  outputSValues: bigint[],
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
    encryptedData: outputHashes.map((_, index) =>
      encrypt({
        amount: outputAmounts[index],
        sValue: outputSValues[index],
      }),
    ),
    outputsOwners,
    publicOutputs,
  };
}

export default async function prepareSpend(
  commitments: SelectedCommitmentRecord[],
  token: Address,
  totalMovingAmount: bigint,
  privateSpendAmount: bigint,
  publicSpendAmount: bigint,
  spender: Address,
  receiver: Address,
  publicOutputs: PublicOutput[],
) {
  const totalMovingPrivatelyAmounts = totalMovingAmount - publicSpendAmount;
  const { outputHashes, outputAmounts, outputSValues } = await createOutputs(
    privateSpendAmount,
    totalMovingPrivatelyAmounts,
  );

  const proofInput = {
    input_amounts: commitments.map((c) => c.value),
    input_sValues: commitments.map((c) => c.sValue),
    inputs_hashes: commitments.map((c) => c.hash),
    output_amounts: outputAmounts,
    output_sValues: outputSValues,
    outputs_hashes: outputHashes,
    fee: publicSpendAmount,
  };

  const circuitType = getCircuitType(commitments.length, outputHashes.length);

  console.log(
    `circuitType: ${circuitType} with proofInput: ${logStringify(proofInput)}`,
  );

  const { calldata_proof } = await generateSpendProof(circuitType, proofInput);

  const transactionStruct = createTransactionStruct(
    token,
    proofInput.inputs_hashes,
    outputAmounts,
    outputSValues,
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
