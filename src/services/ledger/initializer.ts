import { Address } from "viem";
import axios from "axios";

import { type FaucetRpc } from "@src/services/core/faucet.dto";
import { type EvmClients } from "@src/services/Clients";
import { type ViewAccount } from "@src/services/Account";

const axiosInstance = axios.create();

export type Ledger = Awaited<ReturnType<typeof initialize>>;

export const initialize = async (
  viewAccount: ViewAccount,
  evmClients: EvmClients,
  appPrefixKey: string,
  tesUrl: string,
  vaultAddress: Address,
  tokenAddress: Address,
  invoiceFactoryAddress: Address,
  faucetUrl: string,
  initSyncBlock: bigint,
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
    { Invoicing },
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
    import("./Invoicing"),
  ]);

  // Create lightweight dependencies immediately
  const queue = new MemoryQueue();
  const address = evmClients.primaryClient()!.account.address;

  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(axiosInstance, address);

  // Initialize heavy services
  const zeroLedgerDataSource = new DataSource(appPrefixKey);
  const commitments = new Commitments(zeroLedgerDataSource, address);
  const commitmentsHistory = new CommitmentsHistory(
    zeroLedgerDataSource,
    address,
  );
  const syncService = new SyncService(
    evmClients,
    zeroLedgerDataSource,
    address,
    initSyncBlock,
  );
  const tesService = new Tes(tesUrl, viewAccount, queue, axiosInstance);

  return {
    fees: new Fees(evmClients, vaultAddress, tokenAddress, tesService, address),
    watcher: new Watcher(
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
    invoicing: new Invoicing(
      evmClients,
      vaultAddress,
      tokenAddress,
      invoiceFactoryAddress,
      queue,
      tesService,
    ),
    tesService,
  };
};
