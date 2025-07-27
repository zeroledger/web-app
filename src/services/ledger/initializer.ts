import { Address } from "viem";
import axios from "axios";

import { JsonRpcClient } from "@src/services/core/rpc";
import { MemoryQueue } from "@src/services/core/queue";
import { FaucetRpc } from "@src/services/core/faucet.dto";
import { DataSource } from "@src/services/core/db/leveldb.service";
import { TesService } from "@src/services/tes.service";
import { ViewAccountService } from "@src/services/viewAccount.service";
import { EvmClientService } from "@src/services/core/evmClient.service";

import { LedgerService } from "./ledger.service";
import CommitmentsService from "./commitments.service";
import CommitmentsHistoryService from "./history.service";
import SyncService from "./sync.service";
import { ConnectedWallet } from "@privy-io/react-auth";

const axiosInstance = axios.create();

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
  const queue = new MemoryQueue();
  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    wallet.address as Address,
  );
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
  );
};
