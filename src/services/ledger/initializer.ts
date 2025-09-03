import { Address } from "viem";
import axios from "axios";

import { type FaucetRpc } from "@src/services/core/faucet.dto";
import { type EvmClients } from "@src/services/Clients";
import { type ViewAccount } from "@src/services/Account";
import { type ConnectedWallet } from "@privy-io/react-auth";

const axiosInstance = axios.create();

export type Ledger = Awaited<ReturnType<typeof initialize>>;

export const initialize = async (
  wallet: ConnectedWallet,
  viewAccount: ViewAccount,
  evmClients: EvmClients,
  appPrefixKey: string,
  tesUrl: string,
  vaultAddress: Address,
  tokenAddress: Address,
  faucetUrl: string,
) => {
  // Dynamically load heavy dependencies (use preloaded if available)
  const [
    { MemoryQueue },
    { JsonRpcClient },
    { DataSource },
    { default: Commitments },
    { default: CommitmentsHistory },
    { default: SyncService },
    { Tes },
    { Transactions },
    { Fees },
    { Watcher },
  ] = await Promise.all([
    import("@src/services/core/queue"),
    import("@src/services/core/rpc"),
    import("@src/services/core/db/leveldb.source"),
    import("./Commitments"),
    import("./CommitmentsHistory"),
    import("./SyncService"),
    import("@src/services/Tes"),
    import("./Transactions"),
    import("./Fees"),
    import("./Watcher"),
  ]);

  // Create lightweight dependencies immediately
  const queue = new MemoryQueue();
  const address = wallet.address as Address;

  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(axiosInstance, address);

  // Initialize heavy services
  const zeroLedgerDataSource = new DataSource(appPrefixKey);
  const commitments = new Commitments(zeroLedgerDataSource, address);
  const commitmentsHistory = new CommitmentsHistory(
    zeroLedgerDataSource,
    address,
  );
  const syncService = new SyncService(zeroLedgerDataSource, address);
  const tesService = new Tes(tesUrl, viewAccount, queue, axiosInstance);

  return {
    fees: new Fees(evmClients, vaultAddress, tokenAddress, tesService),
    watcher: new Watcher(
      viewAccount,
      evmClients,
      vaultAddress,
      tokenAddress,
      queue,
      commitments,
      commitmentsHistory,
      syncService,
      tesService,
      axiosInstance,
    ),
    transactions: new Transactions(
      evmClients,
      vaultAddress,
      tokenAddress,
      faucetUrl,
      faucetRpcClient,
      queue,
      commitments,
      tesService,
    ),
  };
};
