import { Address, Chain, hashTypedData, Hex, PublicClient } from "viem";
import { FORWARDER_ABI } from "./metatx.abi";
import { CustomClient } from "@src/services/Clients";
import { forwardRequestType } from "./metatx.constants";
import { logStringify } from "../common";

const getForwarderDomain = (
  chainId: Chain["id"],
  verifyingContract: Address,
) => ({
  name: "ZeroLedgerForwarder",
  version: "1",
  chainId,
  verifyingContract: verifyingContract,
});

export async function getForwarderNonce(
  user: Address,
  forwarderAddress: Address,
  client: PublicClient,
) {
  return client.readContract({
    address: forwarderAddress,
    abi: FORWARDER_ABI,
    functionName: "nonces",
    args: [user],
  });
}

export type UnsignedMetaTransaction = {
  from: Address;
  to: Address;
  value: 0n;
  gas: bigint;
  nonce: bigint;
  deadline: number;
  data: Hex;
};

export async function createSignedMetaTx(
  request: UnsignedMetaTransaction,
  forwarderAddress: Address,
  client: CustomClient,
) {
  const obj = {
    domain: getForwarderDomain(client.chain.id, forwarderAddress),
    types: forwardRequestType,
    primaryType: "ForwardRequest" as const,
    message: request,
  };
  console.log(`Request: ${logStringify(obj)}`);
  console.log(`Signed DATA: ${hashTypedData(obj)}`);
  const signature = await client.signTypedData(obj);
  return {
    ...request,
    gas: request.gas.toString(),
    nonce: request.nonce.toString(),
    value: request.value.toString(),
    signature,
  };
}

export type SignedMetaTransaction = Awaited<
  ReturnType<typeof createSignedMetaTx>
>;
