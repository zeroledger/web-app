import { generatePrivateKey } from "viem/accounts";
import {
  CircuitType,
  getCircuitType,
  prover,
  validInputCounts,
} from "@src/utils/prover";
import { type Address, type Hex } from "viem";
import {
  type SpendInput,
  type TransactionStruct,
  type OutputsOwnersStruct,
  type PublicOutput,
  type SelectedCommitmentRecord,
} from "./types";
import { encode } from "./metadata";

const SHARED_INPUT = {
  value: 0n,
  sValue: BigInt(
    "0xa4ab13e44b87313fad927d17efc647642903c8a860f5a2093a2d1c903df80730",
  ),
  hash: 16345784317541686154474118656352090725662212393131703302641232392927716723243n,
};

function formalizeCommitments(
  commitments: SelectedCommitmentRecord[],
): SelectedCommitmentRecord[] {
  if (validInputCounts.some((count) => count === commitments.length)) {
    return commitments;
  }

  // find closed valid input count that bigger than inputs.length
  const closedValidInputCount = validInputCounts.find(
    (count) => count > commitments.length,
  );

  if (!closedValidInputCount) {
    throw new Error("Invalid input count");
  }

  return commitments.concat(
    Array(closedValidInputCount - commitments.length).fill(SHARED_INPUT),
  );
}

async function createOutputs(amount: bigint, totalInputAmount: bigint) {
  const hasChange = totalInputAmount > amount;
  const changeAmount = hasChange ? totalInputAmount - amount : 0n;

  const outputHashes: bigint[] = [];
  const outputAmounts: bigint[] = [];
  const outputSValues: bigint[] = [];

  const receiverSValue = BigInt(generatePrivateKey());
  const { computePoseidon } = await import("@src/utils/poseidon");
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
    const { computePoseidon } = await import("@src/utils/poseidon");
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

  const formalizedCommitments = formalizeCommitments(commitments);

  const proofInput = {
    input_amounts: formalizedCommitments.map((c) => c.value),
    input_sValues: formalizedCommitments.map((c) => c.sValue),
    inputs_hashes: formalizedCommitments.map((c) => c.hash),
    output_amounts: outputAmounts,
    output_sValues: outputSValues,
    outputs_hashes: outputHashes,
    fee: publicSpendAmount,
  };

  const circuitType = getCircuitType(
    formalizedCommitments.length,
    outputHashes.length,
  );

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
