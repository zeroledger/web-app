import { Address, Chain } from "viem";
import axios from "axios";
import {
  TOKEN_ADDRESS,
  FAUCET_URL,
  VAULT_ADDRESS,
  TES_URL,
  APP_PREFIX_KEY,
  RPC,
  WS_RPC,
  pollingInterval,
  FORWARDER_ADDRESS,
} from "@src/common.constants";

import { JsonRpcClient } from "@src/services/core/rpc";
import { MemoryQueue } from "@src/services/core/queue";
import { FaucetRpc } from "@src/services/core/faucet.dto";
import { DataSource } from "@src/services/core/db/leveldb.service";
import TesService from "@src/services/core/tes.service";

import { LedgerService } from "./ledger.service";
import CommitmentsService from "./commitments.service";
import CommitmentsHistoryService from "./history.service";
import SyncService from "./sync.service";
import { AccountService } from "./accounts.service";
import { EvmClientService } from "../core/evmClient.service";
import { ConnectedWallet } from "@privy-io/react-auth";

const axiosInstance = axios.create();

export const initialize = async (
  chain: Chain,
  password: string,
  wallet: ConnectedWallet,
) => {
  const evmClientService = new EvmClientService();
  await evmClientService.open({
    wsUrl: WS_RPC[chain.id],
    httpUrl: RPC[chain.id],
    pollingInterval: pollingInterval[chain.id],
    chain,
    wallet,
  });
  const accountService = new AccountService(APP_PREFIX_KEY);
  await accountService.setupViewAccount(
    password,
    evmClientService.writeClient!,
  );
  const queue = new MemoryQueue();
  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    wallet.address as Address,
  );
  const zeroLedgerDataSource = new DataSource(APP_PREFIX_KEY);
  const commitmentsService = new CommitmentsService(zeroLedgerDataSource);
  const commitmentsHistoryService = new CommitmentsHistoryService(
    zeroLedgerDataSource,
  );
  const syncService = new SyncService(zeroLedgerDataSource);
  const tesService = new TesService(
    TES_URL,
    accountService,
    evmClientService,
    queue,
  );
  const ledgerService = new LedgerService(
    accountService,
    evmClientService,
    VAULT_ADDRESS,
    FORWARDER_ADDRESS,
    TOKEN_ADDRESS,
    FAUCET_URL,
    faucetRpcClient,
    queue,
    commitmentsService,
    commitmentsHistoryService,
    syncService,
    tesService,
  );

  const reset = async () => {
    ledgerService.reset();
    tesService.reset();
    await zeroLedgerDataSource.clear();
    await accountService.reset(wallet.address as Address);
  };

  return {
    ledgerService,
    evmClientService,
    reset,
  };
};
