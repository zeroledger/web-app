import { generatePrivateKey } from "viem/accounts";
import { computePoseidon } from "@src/utils/poseidon";
import { CircuitType, getCircuitType, prover } from "@src/utils/prover";
import { Address, Hex } from "viem";
import {
  SpendInput,
  TransactionStruct,
  OutputsOwnersStruct,
  PublicOutput,
  SelectedCommitmentRecord,
} from "./types";
import { encode } from "./metadata";

async function createOutputs(amount: bigint, totalInputAmount: bigint) {
  const hasChange = totalInputAmount > amount;
  const changeAmount = hasChange ? totalInputAmount - amount : 0n;

  const outputHashes: bigint[] = [];
  const outputAmounts: bigint[] = [];
  const outputSValues: bigint[] = [];

  const receiverSValue = BigInt(generatePrivateKey());
  const receiverHash = await computePoseidon({
    amount,
    entropy: receiverSValue,
  });

  outputHashes.push(receiverHash);
  outputAmounts.push(amount);
  outputSValues.push(receiverSValue);

  // Create change output if needed
  if (hasChange) {
    const changeSValue = BigInt(generatePrivateKey());
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

type TransactionStructCreationInput = {
  token: Address;
  inputHashes: bigint[];
  outputAmounts: bigint[];
  outputSValues: bigint[];
  outputHashes: bigint[];
  spender: Address;
  spenderEncryptionPublicKey: Hex;
  spenderTesUrl: string;
  receiver: Address;
  receiverEncryptionPublicKey: Hex;
  receiverTesUrl: string;
  publicOutputs: PublicOutput[];
};

function createTransactionStruct({
  token,
  inputHashes,
  outputAmounts,
  outputSValues,
  outputHashes,
  spender,
  spenderEncryptionPublicKey,
  spenderTesUrl,
  receiver,
  receiverEncryptionPublicKey,
  receiverTesUrl,
  publicOutputs,
}: TransactionStructCreationInput): TransactionStruct {
  const outputsOwners: OutputsOwnersStruct[] = [
    {
      owner: receiver,
      indexes: [0],
    },
  ];

  const metadata = [
    encode(
      {
        amount: outputAmounts[0],
        sValue: outputSValues[0],
      },
      receiverTesUrl,
      receiverEncryptionPublicKey,
    ),
  ];

  if (outputHashes.length > 1) {
    outputsOwners.push({
      owner: spender,
      indexes: [1],
    });
    metadata.push(
      encode(
        {
          amount: outputAmounts[1],
          sValue: outputSValues[1],
        },
        spenderTesUrl,
        spenderEncryptionPublicKey,
      ),
    );
  }

  return {
    token,
    inputsPoseidonHashes: inputHashes,
    outputsPoseidonHashes: outputHashes,
    metadata,
    outputsOwners,
    publicOutputs,
  };
}

export type PrepareSpendParams = {
  commitments: SelectedCommitmentRecord[];
  token: Address;
  totalMovingAmount: bigint;
  privateSpendAmount: bigint;
  publicSpendAmount: bigint;
  spender: Address;
  spenderEncryptionPublicKey: Hex;
  spenderTesUrl?: string;
  receiver: Address;
  receiverEncryptionPublicKey: Hex;
  receiverTesUrl?: string;
  publicOutputs: PublicOutput[];
};

export default async function prepareSpend({
  commitments,
  token,
  totalMovingAmount,
  privateSpendAmount,
  publicSpendAmount,
  spender,
  spenderEncryptionPublicKey,
  spenderTesUrl = "",
  receiver,
  receiverEncryptionPublicKey,
  receiverTesUrl = "",
  publicOutputs,
}: PrepareSpendParams) {
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

  const { calldata_proof } = await generateSpendProof(circuitType, proofInput);

  const transactionStruct = createTransactionStruct({
    token,
    inputHashes: proofInput.inputs_hashes,
    outputAmounts,
    outputSValues,
    outputHashes,
    spender,
    spenderEncryptionPublicKey,
    spenderTesUrl,
    receiver,
    receiverEncryptionPublicKey,
    receiverTesUrl,
    publicOutputs,
  });

  return {
    proofData: {
      proofInput,
      calldata_proof,
    },
    transactionStruct,
  };
}
