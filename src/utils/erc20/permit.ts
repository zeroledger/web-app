import { Address, Hex } from "viem";
import { ERC_20_WITH_MINT_ABI } from "./constants";
import { type CustomClient } from "@src/services/Clients";
import { toSignature } from "../common";

export type PermitProps = {
  tokenAddress: Hex;
  receiverAddress: Hex;
  amount: bigint;
  deadline: bigint;
  client: CustomClient;
};

export type PermitSignature = ReturnType<typeof toSignature>;

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

export async function permit(params: PermitProps) {
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

  return {
    signature: toSignature(signature),
    deadline,
  };
}

/**
 * Check if a token supports EIP-2612 permit functionality
 * @param tokenAddress - The token contract address
 * @param client - The viem client
 * @returns Promise<boolean> - true if permit is supported, false otherwise
 */
export const permitSupported = async (
  tokenAddress: Address,
  client: CustomClient,
): Promise<boolean> => {
  try {
    // Check if the token has the required functions for permit
    const [nameResult, noncesResult, eip712DomainResult] =
      await client.multicall({
        contracts: [
          {
            address: tokenAddress,
            abi: ERC_20_WITH_MINT_ABI,
            functionName: "name",
          },
          {
            address: tokenAddress,
            abi: ERC_20_WITH_MINT_ABI,
            functionName: "nonces",
            args: [client.account.address], // Test with current account
          },
          {
            address: tokenAddress,
            abi: ERC_20_WITH_MINT_ABI,
            functionName: "eip712Domain",
          },
        ],
      });

    // All three functions must succeed for permit to be supported
    return (
      nameResult.status === "success" &&
      noncesResult.status === "success" &&
      eip712DomainResult.status === "success"
    );
  } catch (error) {
    // If any call fails, permit is not supported
    console.warn(`Permit check failed for token ${tokenAddress}:`, error);
    return false;
  }
};
