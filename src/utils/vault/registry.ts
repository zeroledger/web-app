import { CustomClient } from "@src/common.types";
import { Address } from "viem";
import { VAULT_ABI, REGISTRY_ABI } from "./vault.abi";

export type RegistryParams = {
  client: CustomClient;
  address: Address;
};

export function getRegistry(vaultAddress: Address, client: CustomClient) {
  return client.readContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: "encryptionRegistry",
  });
}

export async function isUserRegistered(
  userAddress: Address,
  vaultAddress: Address,
  client: CustomClient,
) {
  const registry = await getRegistry(vaultAddress, client);
  const [publicKey, active] = await client.readContract({
    address: registry,
    abi: REGISTRY_ABI,
    functionName: "encryptionPubKeys",
    args: [userAddress],
  });

  return {
    publicKey,
    active,
  };
}
