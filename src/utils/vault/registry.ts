import { type CustomClient } from "@src/services/Clients";
import { Address, encodeFunctionData, Hash, PublicClient } from "viem";
import { VAULT_ABI, REGISTRY_ABI } from "./vault.abi";
import {
  PK_REGISTRATION_GAS_COST,
  FORWARDER_EXECUTION_COST,
  GAS_LIMIT_NOMINATOR,
  GAS_LIMIT_DENOMINATOR,
} from "./vault.constants";

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

export async function getRegisterRequest(
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

export async function register(
  viewPublicKey: Hash,
  vaultAddress: Address,
  client: CustomClient,
) {
  const request = await getRegisterRequest(viewPublicKey, vaultAddress, client);
  const txHash = await client.writeContract(request);
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}

export const registerGasSponsoredLimit = () =>
  (PK_REGISTRATION_GAS_COST * GAS_LIMIT_NOMINATOR) / GAS_LIMIT_DENOMINATOR +
  FORWARDER_EXECUTION_COST;

export function getRegisterTxData(viewPublicKey: Hash) {
  return encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: "register",
    args: [viewPublicKey],
  });
}

export async function getRegisterTxGas(
  viewPublicKey: Hash,
  vaultAddress: Address,
  client: CustomClient,
) {
  const registry = await getRegistry(vaultAddress, client);

  return client.estimateContractGas({
    address: registry,
    abi: REGISTRY_ABI,
    functionName: "register",
    args: [viewPublicKey],
  });
}
