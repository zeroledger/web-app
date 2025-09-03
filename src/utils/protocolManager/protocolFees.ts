import { PROTOCOL_MANAGER_ABI } from "./protocolManager.abi";
import { Address, PublicClient } from "viem";

export const getProtocolFees = async (params: {
  client: PublicClient;
  protocolManager: Address;
  token: Address;
}) => {
  return params.client.readContract({
    address: params.protocolManager,
    abi: PROTOCOL_MANAGER_ABI,
    functionName: "getFees",
    args: [params.token],
  });
};
