import { generatePrivateKey } from "viem/accounts";
import { Address, Hex } from "viem";
import { prover } from "@src/utils/prover";
import {
  DecoyParams,
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
  value: bigint,
  userAddress: Address,
  userEncryptionPublicKey: Hex,
  tesUrl: string,
  twoDecoys?: DecoyParams[],
): Promise<DepositCommitmentData> {
  const amounts: bigint[] = [];
  const sValues: bigint[] = [];
  const hashes: bigint[] = [];
  const { computePoseidon } = await import("@src/utils/poseidon");

  if (twoDecoys) {
    const params = shuffle(
      await Promise.all(
        Array.from({ length: 3 }, async (_, i) => {
          const decoySValue = BigInt(generatePrivateKey());
          const amount = i === 0 ? value : 0n;
          return {
            hash: await computePoseidon({
              amount: amount,
              entropy: decoySValue,
            }),
            owner: i === 0 ? userAddress : twoDecoys[i - 1].address,
            amount: amount,
            sValue: decoySValue,
            tesUrl: i === 0 ? tesUrl : "",
            userEncryptionPublicKey:
              i === 0 ? userEncryptionPublicKey : twoDecoys[i - 1].publicKey,
          };
        }),
      ),
    );
    const depositCommitmentParams = (await Promise.all(
      params.map(async (param) => {
        amounts.push(param.amount);
        sValues.push(param.sValue);
        hashes.push(param.hash);
        return {
          poseidonHash: param.hash,
          owner: param.owner,
          metadata: encode(
            { amount: param.amount, sValue: param.sValue },
            param.tesUrl,
            param.userEncryptionPublicKey,
          ),
        };
      }),
    )) as [
      DepositCommitmentParamsStruct,
      DepositCommitmentParamsStruct,
      DepositCommitmentParamsStruct,
    ];
    return { amounts, sValues, hashes, depositCommitmentParams };
  }

  let valueLef = value;
  for (let i = 0; i < 3; i++) {
    const random = BigInt(Math.ceil(Math.random() * 3));
    const amount = i < 2 ? valueLef / random : valueLef;
    valueLef -= amount;
    const sValue = BigInt(generatePrivateKey());
    sValues.push(sValue);
    amounts.push(amount);
    const hash = await computePoseidon({
      amount: amount,
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
  decoyParams?: DecoyParams[],
) {
  const valueLeftForUser = value - protocolDepositFee - forwarderFee;

  const depositCommitmentData = await generateDepositCommitmentData(
    valueLeftForUser,
    user,
    userEncryptionPublicKey,
    tesUrl,
    decoyParams,
  );

  const depositData: DepositData = {
    valueLeftForUser,
    individualAmounts: depositCommitmentData.amounts,
    user,
    protocolDepositFee,
    forwarderFee,
    forwarderFeeRecipient,
  };

  const proofData = await generateDepositProof(
    depositCommitmentData.hashes,
    valueLeftForUser,
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
