import { VAULT_ABI } from "./vault.abi";
import { Address, PublicClient } from "viem";

export const getTrustedForwarder = (params: {
  client: PublicClient;
  contract: Address;
}) => {
  return params.client.readContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "getTrustedForwarder",
  });
};

export const getProtocolManager = (params: {
  client: PublicClient;
  contract: Address;
}) => {
  return params.client.readContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "getManager",
  });
};
