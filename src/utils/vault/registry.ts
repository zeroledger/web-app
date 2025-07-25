import { type CustomClient } from "@src/services/core/evmClient.service";
import { Address, Hash, PublicClient } from "viem";
import { VAULT_ABI, REGISTRY_ABI } from "./vault.abi";

export type RegistryParams = {
  client: CustomClient;
  address: Address;
};

export function getRegistry(
  vaultAddress: Address,
  client: PublicClient | CustomClient,
) {
  return client.readContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: "encryptionRegistry",
  });
}

export async function isUserRegistered(
  userAddress: Address,
  vaultAddress: Address,
  client: PublicClient,
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

export async function getRegisterTransaction(
  viewPublicKey: Hash,
  vaultAddress: Address,
  client: CustomClient,
) {
  const registry = await getRegistry(vaultAddress, client);
  const { request } = await client.simulateContract({
    address: registry,
    abi: REGISTRY_ABI,
    functionName: "register",
    args: [viewPublicKey],
  });

  return request;
}
