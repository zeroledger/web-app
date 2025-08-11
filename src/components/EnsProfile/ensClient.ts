import { createPublicClient, http } from "viem";
import { ENV } from "@src/common.constants";
import { mainnet, sepolia } from "viem/chains";

export const ensClient = createPublicClient({
  chain: ENV === "test" ? sepolia : mainnet,
  transport: http(
    ENV === "test"
      ? "https://ethereum-sepolia-rpc.publicnode.com"
      : "https://ethereum-rpc.publicnode.com",
  ),
});
