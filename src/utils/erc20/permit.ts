import { Address, Hex, slice } from "viem";
import { ERC_20_WITH_MINT_ABI } from "./constants";
import { type CustomClient } from "@src/services/Clients";
import { toViemSignature } from "../common";

export type PermitProps = {
  tokenAddress: Hex;
  receiverAddress: Hex;
  amount: bigint;
  deadline: bigint;
  client: CustomClient;
};

// EIP-712 types for permit
const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

// Get the EIP-712 domain for the ERC20 token
async function getPermitDomain(tokenAddress: Address, client: CustomClient) {
  const [nameResult, versionResult] = await client.multicall({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC_20_WITH_MINT_ABI,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: ERC_20_WITH_MINT_ABI,
        functionName: "eip712Domain",
      },
    ],
  });

  // Extract version from eip712Domain result
  const [, , domainVersion, , ,] = versionResult.result!;

  return {
    name: nameResult.result as string,
    version: domainVersion,
    chainId: client.chain.id,
    verifyingContract: tokenAddress,
  };
}

// Get the current nonce for the owner
async function getNonce(
  tokenAddress: Address,
  owner: Address,
  client: CustomClient,
) {
  return client.readContract({
    address: tokenAddress,
    abi: ERC_20_WITH_MINT_ABI,
    functionName: "nonces",
    args: [owner],
  });
}

// Split signature into v, r, s components
export function splitSignature(signature: Hex) {
  const r = slice(signature, 0, 32);
  const s = slice(signature, 32, 64);
  const v = parseInt(slice(signature, 64, 65));

  return { r, s, v };
}

export default async function permit(params: PermitProps) {
  const { tokenAddress, receiverAddress, amount, deadline, client } = params;

  // Get the owner address from the client
  const owner = client.account.address;

  // Get the current nonce for the owner
  const nonce = await getNonce(tokenAddress, owner, client);

  // Get the EIP-712 domain
  const domain = await getPermitDomain(tokenAddress, client);

  // Create the permit message
  const message = {
    owner,
    spender: receiverAddress,
    value: amount,
    nonce,
    deadline,
  };

  // Sign the typed data
  const signature = await client.signTypedData({
    domain,
    types: permitTypes,
    primaryType: "Permit",
    message,
  });

  return toViemSignature(signature);
}
