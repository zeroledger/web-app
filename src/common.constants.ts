import { type Address } from "viem";
import { optimismSepolia } from "viem/chains";

export const OnesHash =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const DEEP_HASH_APP_PREFIX_KEY = "flank-app";

export const TOKEN_ADDRESS: Address = import.meta.env.VITE_TOKEN_ADDRESS;

export const DEEP_HASH_ADDRESS: Address = import.meta.env.VITE_PRYX_ADDRESS;

export const OPERATOR_URL: Address = import.meta.env.VITE_OPERATOR_URL;

export const COORDINATOR_URL: Address = import.meta.env.VITE_COORDINATOR_URL;

export const RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `https://optimism-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
};

export const WS_RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `wss://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
};

export const pollingInterval: { [prop: number]: number } = {
  [optimismSepolia.id]: parseInt(import.meta.env.VITE_POOLING_INTERVAL),
};
