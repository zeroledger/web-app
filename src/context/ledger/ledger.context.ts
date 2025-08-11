import { createContext } from "react";
import { type LedgerService } from "@src/services/ledger";
import { ConnectedWallet } from "@privy-io/react-auth";

export const LedgerContext = createContext<{
  ledgerService?: LedgerService;
  privateBalance: bigint;
  isConnecting: boolean;
  error?: Error;
  blocksToSync?: bigint;
  wallet?: ConnectedWallet;
}>({
  privateBalance: 0n,
  isConnecting: false,
  blocksToSync: undefined,
  wallet: undefined,
});
