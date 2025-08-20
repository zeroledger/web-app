import { Address, Chain, Hex, PublicClient } from "viem";
import { FORWARDER_ABI } from "./metatx.abi";
import { CustomClient } from "@src/services/Clients";
import { forwardRequestType } from "./metatx.constants";

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
  value: 0;
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
  const signature = await client.signTypedData({
    domain: getForwarderDomain(client.chain.id, forwarderAddress),
    types: forwardRequestType,
    primaryType: "ForwardRequest",
    message: request,
  });
  return {
    ...request,
    gas: request.gas.toString(),
    nonce: request.nonce.toString(),
    signature,
  };
}

export type SignedMetaTransaction = Awaited<
  ReturnType<typeof createSignedMetaTx>
>;
