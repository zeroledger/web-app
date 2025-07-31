import { type Address } from "viem";
import { arbitrumSepolia, baseSepolia, optimismSepolia } from "viem/chains";

export const SUPPORTED_CHAINS = [optimismSepolia];

export const OnesHash =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const APP_PREFIX_KEY = "zeroledger-app";

export const TOKEN_ADDRESS: Address =
  "0x6Af5C33c20ca6169B3D98A2bcc94bDD0F4f68ffd";

// expected to have same address on all chains
export const VAULT_ADDRESS: Address =
  "0xf27f9eda911278da4988537994141e697e8e0798";

// expected to have same address on all chains
export const FORWARDER_ADDRESS: Address =
  "0xd4a838dfa0fd81d5b7a129879c16d7bc8e16fd55";

export const FAUCET_URL: Address = import.meta.env.VITE_FAUCET_URL;

export const TES_URL: Address = import.meta.env.VITE_TES_URL;

export const PRIVY_APP_ID: Address = import.meta.env.VITE_PRIVY_APP_ID;

export const RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `https://optimism-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
  [baseSepolia.id]: `https://base-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
  [arbitrumSepolia.id]: `https://arbitrum-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
};

export const WS_RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `wss://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  [baseSepolia.id]: `wss://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  [arbitrumSepolia.id]: `wss://arb-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
};

export const pollingInterval: { [prop: number]: number } = {
  [optimismSepolia.id]: 10000,
  [baseSepolia.id]: 10000,
  [arbitrumSepolia.id]: 10000,
};
