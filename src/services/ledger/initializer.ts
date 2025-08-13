import { Address } from "viem";
import axios from "axios";

import { type FaucetRpc } from "@src/services/core/faucet.dto";
import { type EvmClients } from "@src/services/Clients";
import { type ViewAccount } from "@src/services/Account";
import { type ConnectedWallet } from "@privy-io/react-auth";

const axiosInstance = axios.create();

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [
    { MemoryQueue },
    { JsonRpcClient },
    { DataSource },
    { default: Commitments },
    { default: CommitmentsHistory },
    { default: SyncService },
    { Tes },
    { Ledger },
  ] = await Promise.all([
    import("@src/services/core/queue"),
    import("@src/services/core/rpc"),
    import("@src/services/core/db/leveldb.source"),
    import("./Commitments"),
    import("./CommitmentsHistory"),
    import("./SyncService"),
    import("@src/services/Tes"),
    import("./Ledger"),
  ]);

  return {
    MemoryQueue,
    JsonRpcClient,
    DataSource,
    Commitments,
    CommitmentsHistory,
    SyncService,
    Tes,
    Ledger,
  };
};

// Cache for preloaded modules
const preloadedModulesPromise = loadHeavyDependencies();

export const initialize = async (
  wallet: ConnectedWallet,
  viewAccount: ViewAccount,
  evmClients: EvmClients,
  appPrefixKey: string,
  tesUrl: string,
  vaultAddress: Address,
  forwarderAddress: Address,
  tokenAddress: Address,
  faucetUrl: string,
) => {
  // Dynamically load heavy dependencies (use preloaded if available)
  const {
    MemoryQueue,
    JsonRpcClient,
    DataSource,
    Commitments,
    CommitmentsHistory,
    SyncService,
    Tes,
    Ledger,
  } = await preloadedModulesPromise;

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

  return new Ledger(
    viewAccount,
    evmClients,
    vaultAddress,
    forwarderAddress,
    tokenAddress,
    faucetUrl,
    faucetRpcClient,
    queue,
    commitments,
    commitmentsHistory,
    syncService,
    tesService,
    axiosInstance,
  );
};
