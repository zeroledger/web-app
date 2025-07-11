import { COMMITMENTS_ABI } from "./vault.abi";
import { encodeAbiParameters, Hex, decodeAbiParameters } from "viem";
import { CommitmentStruct } from "./types";

export const encrypt = (commitment: CommitmentStruct) => {
  return encodeAbiParameters(COMMITMENTS_ABI, [
    commitment.amount,
    commitment.sValue,
  ]);
};

export const decrypt = (encryptedData: Hex) => {
  const [amount, sValue] = decodeAbiParameters(COMMITMENTS_ABI, encryptedData);
  return {
    amount: BigInt(amount),
    sValue: BigInt(sValue),
  } as CommitmentStruct;
};
