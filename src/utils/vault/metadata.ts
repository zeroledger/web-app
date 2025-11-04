import { ENCRYPTION_ABI } from "./vault.abi";
import {
  encodeAbiParameters,
  Hex,
  decodeAbiParameters,
  toHex,
  Hash,
  hexToBigInt,
} from "viem";
import { CommitmentStruct } from "./types";
import { decryptQuantum, encryptQuantum } from "@zeroledger/vycrypt";

export const serializeCommitment = (commitment: CommitmentStruct) => ({
  amount: toHex(commitment.amount),
  sValue: toHex(commitment.sValue),
});

export const deSerializeCommitment = (
  commitment: ReturnType<typeof serializeCommitment>,
) => ({
  amount: hexToBigInt(commitment.amount),
  sValue: hexToBigInt(commitment.sValue),
});

export const encode = (
  commitment: CommitmentStruct,
  tesUrl: string,
  encryptionKey: Hex,
  message?: string,
) => {
  const encryptedCommitment = encryptQuantum(
    JSON.stringify(serializeCommitment(commitment)),
    encryptionKey,
  );
  return encodeAbiParameters(ENCRYPTION_ABI, [
    encryptedCommitment,
    tesUrl,
    message || "",
  ]);
};

export const decodeMetadata = (metadata: Hex) => {
  const [encryptedCommitment, tesUrl, message] = decodeAbiParameters(
    ENCRYPTION_ABI,
    metadata,
  );
  return {
    encryptedCommitment,
    tesUrl,
    message,
  };
};

export const decryptCommitment = (
  encryptedCommitment: Hex,
  decryptionKey: Hash,
): CommitmentStruct => {
  const decryptedCommitment = JSON.parse(
    decryptQuantum(decryptionKey, encryptedCommitment),
  ) as ReturnType<typeof serializeCommitment>;
  return deSerializeCommitment(decryptedCommitment);
};
