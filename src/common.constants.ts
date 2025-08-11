import { type Address } from "viem";
import { base, optimismSepolia } from "viem/chains";

export const ENV = document.location.hostname.match(/localhost|tmp|test/i)
  ? "test"
  : "prod";

export const SUPPORTED_CHAINS = ENV === "test" ? [optimismSepolia] : [base];

export const OnesHash =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const APP_PREFIX_KEY =
  ENV === "test" ? "zeroledger-app-test" : "zeroledger-app";

export const TOKEN_ADDRESS: Address =
  "0x6Af5C33c20ca6169B3D98A2bcc94bDD0F4f68ffd";

// expected to have same address on all chains
export const VAULT_ADDRESS: Address =
  "0xf27F9EDA911278dA4988537994141e697E8E0798";

// expected to have same address on all chains
export const FORWARDER_ADDRESS: Address =
  "0xD4a838dfA0fd81D5B7a129879c16d7BC8E16Fd55";

export const FAUCET_URL: Address = import.meta.env.VITE_FAUCET_URL;

export const TES_URL: Address = import.meta.env.VITE_TES_URL;

export const PRIVY_APP_ID: Address = import.meta.env.VITE_PRIVY_APP_ID;

export const RPC: { [prop: number]: string[] } = {
  [optimismSepolia.id]: [
    "https://optimism-sepolia-rpc.publicnode.com",
    `https://optimism-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
    `https://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  ],
};

export const WS_RPC: { [prop: number]: string[] } = {
  [optimismSepolia.id]: [
    "wss://optimism-sepolia-rpc.publicnode.com",
    `wss://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  ],
};

export const pollingInterval: { [prop: number]: number } = {
  [optimismSepolia.id]: 10000,
};
