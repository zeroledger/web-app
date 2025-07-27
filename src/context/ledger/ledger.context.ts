import { createContext } from "react";
import { LedgerService } from "@src/services/ledger";

export const LedgerContext = createContext<{
  ledgerService?: LedgerService;
  privateBalance: bigint;
  isConnecting: boolean;
  error?: Error;
}>({
  privateBalance: 0n,
  isConnecting: false,
});
