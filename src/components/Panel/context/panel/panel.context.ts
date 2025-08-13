import { createContext } from "react";

export const PanelContext = createContext<{
  privateBalance: bigint;
  isConnecting: boolean;
  error?: Error;
  blocksToSync?: bigint;
  symbol: string;
  publicBalance: bigint;
  decimals: number;
  isMetadataLoading: boolean;
  metadataError?: Error;
}>({
  symbol: "",
  publicBalance: 0n,
  decimals: 0,
  isMetadataLoading: false,
  privateBalance: 0n,
  isConnecting: false,
});
