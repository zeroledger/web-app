import { type Address } from "viem";
import { base, baseSepolia, hardhat } from "viem/chains";

const matchedEnv = document.location.hostname.match(/localhost|test/i);

export const ENV = (matchedEnv ? matchedEnv[0] : "prod") as
  | "localhost"
  | "test"
  | "prod";

const hardhatBaseFork = {
  ...hardhat,
  contracts: base.contracts,
};

const supportedChainsPerEnvMap = {
  localhost: [baseSepolia],
  test: [baseSepolia],
  prod: [base],
};

export const SUPPORTED_CHAINS = supportedChainsPerEnvMap[ENV];

export const OnesHash =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const TOKEN_ADDRESS: Address = import.meta.env.VITE_TOKEN_ADDRESS;

export const INIT_SYNC_BLOCK: bigint = BigInt(
  import.meta.env.VITE_INIT_SYNC_BLOCK,
);

export const VAULT_ADDRESS: Address = import.meta.env.VITE_VAULT_ADDRESS;

export const APP_PREFIX_KEY = `${document.location.hostname}.${VAULT_ADDRESS}`;

export const FAUCET_URL: Address = import.meta.env.VITE_FAUCET_URL;

export const TES_URL: Address = import.meta.env.VITE_TES_URL;

export const DOCS_URL = import.meta.env.VITE_DOCS_URL;

export const PRIVY_APP_ID: string = import.meta.env.VITE_PRIVY_APP_ID;

export const PRIVY_CLIENT_ID: string = import.meta.env.VITE_PRIVY_CLIENT_ID;

export const RPC: { [prop: number]: string[] } = {
  [baseSepolia.id]: [
    "https://base-sepolia-rpc.publicnode.com",
    `https://base-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_RPC_KEY}`,
    `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  ],
  [hardhatBaseFork.id]: ["http://localhost:8545"],
};

export const WS_RPC: { [prop: number]: string[] } = {
  [baseSepolia.id]: [
    "wss://base-sepolia-rpc.publicnode.com",
    `wss://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_RPC_KEY}`,
  ],
  [hardhatBaseFork.id]: [],
};

export const SCAN_URL: { [prop: number]: string } = {
  [baseSepolia.id]: "https://sepolia.basescan.org",
  [hardhatBaseFork.id]: "https://sepolia.basescan.org",
};

export const pollingInterval: { [prop: number]: number } = {
  [baseSepolia.id]: 10_000,
  [hardhatBaseFork.id]: 2_000,
  [base.id]: 10_000,
};
