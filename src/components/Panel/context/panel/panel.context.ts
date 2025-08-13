import { createContext } from "react";

export const PanelContext = createContext<{
  privateBalance: bigint;
  isLoading: boolean;
  error?: Error;
  blocksToSync?: bigint;
  symbol: string;
  publicBalance: bigint;
  decimals: number;
  metadataError?: Error;
}>({
  symbol: "",
  publicBalance: 0n,
  decimals: 0,
  privateBalance: 0n,
  isLoading: false,
});
