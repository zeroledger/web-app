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
  DecoyParams,
} from "./types";
import { encode } from "./metadata";
import { createRandomString, shuffle } from "@src/utils/common";

// poseidon hash of "[0, uint256(keccak256("shared-input"))]"
const SHARED_INPUT = {
  value: 0n,
  sValue: BigInt(
    "0x8b4795ac6f891b04ae5bcb1821e66edae6d70aee3c18f33f685da34e10bb15d6",
  ),
  hash: 15137436504035450233189320721078414488136960400594787218856438198681086299747n,
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

type OutputRecord = SelectedCommitmentRecord & {
  type: "receiver" | "change" | "decoy";
};

async function createOutputs(
  amount: bigint,
  totalInputAmount: bigint,
  assignDecoy: boolean,
) {
  const hasChange = totalInputAmount > amount;
  const changeAmount = hasChange ? totalInputAmount - amount : 0n;

  const receiverSValue = BigInt(generatePrivateKey());
  const { computePoseidon } = await import("@src/utils/poseidon");
  const receiverHash = await computePoseidon({
    amount,
    entropy: receiverSValue,
  });

  const result: OutputRecord[] = [
    {
      hash: receiverHash,
      value: amount,
      sValue: receiverSValue,
      type: "receiver",
    },
  ];

  // Create change output if needed
  if (hasChange) {
    const changeSValue = BigInt(generatePrivateKey());
    const changeHash = await computePoseidon({
      amount: changeAmount,
      entropy: changeSValue,
    });

    result.push({
      hash: changeHash,
      value: changeAmount,
      sValue: changeSValue,
      type: "change",
    });
  }

  if (assignDecoy) {
    const decoySValue = BigInt(generatePrivateKey());

    result.push({
      hash: await computePoseidon({
        amount: 0n,
        entropy: decoySValue,
      }),
      value: 0n,
      sValue: decoySValue,
      type: "decoy",
    });
  }

  return shuffle(result);
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
  outputs: OutputRecord[];
  decoyParams?: DecoyParams;
  spender: Address;
  spenderEncryptionPublicKey: Hex;
  spenderTesUrl: string;
  receiver: Address;
  receiverEncryptionPublicKey: Hex;
  receiverTesUrl: string;
  publicOutputs: PublicOutput[];
  messageToReceiver?: string;
};

function createTransactionStruct({
  token,
  inputHashes,
  outputs,
  decoyParams,
  spender,
  spenderEncryptionPublicKey,
  spenderTesUrl,
  receiver,
  receiverEncryptionPublicKey,
  receiverTesUrl,
  publicOutputs,
  messageToReceiver,
}: TransactionStructCreationInput): TransactionStruct {
  const receiverRecordIndex = outputs.findIndex(
    ({ type }) => type === "receiver",
  );
  const changeRecordIndex = outputs.findIndex(({ type }) => type === "change");
  const decoyRecordIndex = outputs.findIndex(({ type }) => type === "decoy");

  const outputsOwners: OutputsOwnersStruct[] = [
    {
      owner: receiver,
      indexes: [receiverRecordIndex],
    },
  ];

  const metadata: Hex[] = [];

  // Encode metadata for receiver with optional message
  metadata[receiverRecordIndex] = encode(
    {
      amount: outputs[receiverRecordIndex]!.value,
      sValue: outputs[receiverRecordIndex]!.sValue,
    },
    receiverTesUrl,
    receiverEncryptionPublicKey,
    messageToReceiver,
  );

  if (changeRecordIndex !== -1) {
    outputsOwners.push({
      owner: spender,
      indexes: [changeRecordIndex],
    });
    metadata[changeRecordIndex] = encode(
      {
        amount: outputs[changeRecordIndex].value,
        sValue: outputs[changeRecordIndex].sValue,
      },
      spenderTesUrl,
      spenderEncryptionPublicKey,
    );
  }

  if (decoyRecordIndex !== -1) {
    outputsOwners.push({
      owner: decoyParams!.address,
      indexes: [decoyRecordIndex],
    });
    metadata[decoyRecordIndex] = encode(
      {
        amount: outputs[decoyRecordIndex].value,
        sValue: outputs[decoyRecordIndex].sValue,
      },
      "",
      decoyParams!.publicKey,
      // to emulate message for decoy recipient
      createRandomString(messageToReceiver?.length || 0),
    );
  }

  return {
    token,
    inputsPoseidonHashes: inputHashes,
    outputsPoseidonHashes: outputs.map((o) => o.hash),
    metadata,
    outputsOwners,
    publicOutputs,
  };
}

export type PrepareSpendParams = {
  // commitments to spend
  commitments: SelectedCommitmentRecord[];
  // token to spend
  token: Address;
  // amount to spend privately including change
  movingAmount: bigint;
  // protocol fee
  protocolFee: bigint;
  // sender address
  spender: Address;
  // spender encryption public key
  spenderEncryptionPublicKey: Hex;
  // spender tes url
  spenderTesUrl?: string;
  // receiver address
  receiver: Address;
  // receiver encryption public key
  receiverEncryptionPublicKey: Hex;
  // receiver tes url
  receiverTesUrl?: string;
  // amount to send to receiver
  privateSpend: bigint;
  // public outputs
  publicOutputs: PublicOutput[];
  // decoy params
  decoyParams?: DecoyParams;
  // optional message for recipient
  messageToReceiver?: string;
};

export default async function prepareSpend({
  token,
  commitments,
  movingAmount,
  protocolFee,
  spender,
  spenderEncryptionPublicKey,
  spenderTesUrl = "",
  receiver,
  receiverEncryptionPublicKey,
  receiverTesUrl = "",
  privateSpend,
  publicOutputs,
  decoyParams,
  messageToReceiver,
}: PrepareSpendParams) {
  const publicMovingAmount = publicOutputs.reduce(
    (acc, item) => acc + item.amount,
    0n,
  );

  const outputs = await createOutputs(
    privateSpend,
    movingAmount - publicMovingAmount - protocolFee,
    Boolean(decoyParams),
  );

  const formalizedCommitments = formalizeCommitments(commitments);

  const proofInput = {
    input_amounts: formalizedCommitments.map((c) => c.value),
    input_sValues: formalizedCommitments.map((c) => c.sValue),
    inputs_hashes: formalizedCommitments.map((c) => c.hash),
    output_amounts: outputs.map((c) => c.value),
    output_sValues: outputs.map((c) => c.sValue),
    outputs_hashes: outputs.map((c) => c.hash),
    // todo: rename in circuit to public spend amount
    fee: publicMovingAmount + protocolFee,
  };

  const circuitType = getCircuitType(
    formalizedCommitments.length,
    Object.keys(outputs).length,
  );

  const { calldata_proof } = await generateSpendProof(circuitType, proofInput);

  const transactionStruct = createTransactionStruct({
    token,
    inputHashes: proofInput.inputs_hashes,
    outputs,
    decoyParams,
    spender,
    spenderEncryptionPublicKey,
    spenderTesUrl,
    receiver,
    receiverEncryptionPublicKey,
    receiverTesUrl,
    publicOutputs,
    messageToReceiver,
  });

  return {
    proofData: {
      proofInput,
      calldata_proof,
    },
    transactionStruct,
  };
}
