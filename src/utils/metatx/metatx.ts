import { Address, Chain, Hex } from "viem";
import { FORWARDER_ABI } from "./metatx.abi";
import { CustomClient } from "@src/services/core/evmClient.service";
import { forwardRequestType } from "./constants";

const getForwarderDomain = (
  chainId: Chain["id"],
  verifyingContract: Address,
) => ({
  name: "BaseForwarder",
  version: "1",
  chainId,
  verifyingContract: verifyingContract,
});

export async function getForwarderNonce(
  forwarderAddress: Address,
  client: CustomClient,
) {
  return client.readContract({
    address: forwarderAddress,
    abi: FORWARDER_ABI,
    functionName: "nonces",
    args: [forwarderAddress],
  });
}

export type MetaTransactionBody = {
  from: Address;
  to: Address;
  value: 0;
  gas?: bigint;
  nonce: bigint;
  deadline: number;
  data: Hex;
};

export async function createSignedMetaTx(
  request: MetaTransactionBody,
  forwarderAddress: Address,
  client: CustomClient,
) {
  const signature = await client.signTypedData({
    domain: getForwarderDomain(client.chain.id, forwarderAddress),
    types: forwardRequestType,
    primaryType: "ForwardRequest",
    message: request,
  });
  return { ...request, signature };
}
