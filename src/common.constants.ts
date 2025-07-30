import { type Address } from "viem";
import { optimismSepolia } from "viem/chains";

export const OnesHash =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const APP_PREFIX_KEY = "zeroledger-app";

export const TOKEN_ADDRESS: Address = import.meta.env.VITE_TOKEN_ADDRESS;

export const FAUCET_URL: Address = import.meta.env.VITE_FAUCET_URL;

export const TES_URL: Address = import.meta.env.VITE_TES_URL;

export const VAULT_ADDRESS: Address = import.meta.env.VITE_VAULT_ADDRESS;

export const FORWARDER_ADDRESS: Address = import.meta.env
  .VITE_FORWARDER_ADDRESS;

export const PRIVY_APP_ID: Address = import.meta.env.VITE_PRIVY_APP_ID;

export const RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `https://optimism-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
};

export const WS_RPC: { [prop: number]: string } = {
  [optimismSepolia.id]: `wss://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
};

export const pollingInterval: { [prop: number]: number } = {
  [optimismSepolia.id]: parseInt(import.meta.env.VITE_POOLING_INTERVAL),
};
