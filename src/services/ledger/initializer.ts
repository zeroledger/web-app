import { Address } from "viem";
import axios from "axios";

import { type FaucetRpc } from "@src/services/core/faucet.dto";
import { type EvmClientService } from "@src/services/core/evmClient.service";
import { type ViewAccountService } from "@src/services/viewAccount.service";
import { type ConnectedWallet } from "@privy-io/react-auth";

const axiosInstance = axios.create();

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [
    { MemoryQueue },
    { JsonRpcClient },
    { DataSource },
    { default: CommitmentsService },
    { default: CommitmentsHistoryService },
    { default: SyncService },
    { TesService },
    { LedgerService },
  ] = await Promise.all([
    import("@src/services/core/queue"),
    import("@src/services/core/rpc"),
    import("@src/services/core/db/leveldb.service"),
    import("./commitments.service"),
    import("./history.service"),
    import("./sync.service"),
    import("@src/services/tes.service"),
    import("@src/services/ledger/ledger.service"),
  ]);

  return {
    MemoryQueue,
    JsonRpcClient,
    DataSource,
    CommitmentsService,
    CommitmentsHistoryService,
    SyncService,
    TesService,
    LedgerService,
  };
};

// Cache for preloaded modules
const preloadedModulesPromise = loadHeavyDependencies();

export const initialize = async (
  wallet: ConnectedWallet,
  viewAccountService: ViewAccountService,
  evmClientService: EvmClientService,
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
    CommitmentsService,
    CommitmentsHistoryService,
    SyncService,
    TesService,
    LedgerService,
  } = await preloadedModulesPromise;

  // Create lightweight dependencies immediately
  const queue = new MemoryQueue();

  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    wallet.address as Address,
  );

  // Initialize heavy services
  const zeroLedgerDataSource = new DataSource(appPrefixKey);
  const commitmentsService = new CommitmentsService(zeroLedgerDataSource);
  const commitmentsHistoryService = new CommitmentsHistoryService(
    zeroLedgerDataSource,
  );
  const syncService = new SyncService(zeroLedgerDataSource);
  const tesService = new TesService(
    tesUrl,
    viewAccountService,
    evmClientService,
    queue,
    axiosInstance,
  );

  return new LedgerService(
    viewAccountService,
    evmClientService,
    vaultAddress,
    forwarderAddress,
    tokenAddress,
    faucetUrl,
    faucetRpcClient,
    queue,
    commitmentsService,
    commitmentsHistoryService,
    syncService,
    tesService,
    axiosInstance,
  );
};
