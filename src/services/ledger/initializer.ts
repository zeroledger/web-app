import { Chain, type Hex } from "viem";
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
import { accountService } from "./accounts.service";
import { EvmClientService } from "../core/evmClient.service";

const axiosInstance = axios.create();

export const initialize = async (
  chain: Chain,
  password: string,
  privateKey?: Hex,
) => {
  await accountService.open(password, privateKey);
  await accountService.setupViewAccount();
  const evmClientService = new EvmClientService(
    WS_RPC[chain.id],
    RPC[chain.id],
    pollingInterval[chain.id],
    accountService,
    chain,
  );
  const queue = new MemoryQueue();
  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    accountService.getAccount()?.address,
  );
  const zeroLedgerDataSource = new DataSource(APP_PREFIX_KEY);
  const commitmentsService = new CommitmentsService(zeroLedgerDataSource);
  const commitmentsHistoryService = new CommitmentsHistoryService(
    zeroLedgerDataSource,
  );
  const syncService = new SyncService(zeroLedgerDataSource);
  const tesService = new TesService(TES_URL, accountService, queue);
  const ledgerService = new LedgerService(
    accountService,
    evmClientService,
    VAULT_ADDRESS,
    TOKEN_ADDRESS,
    FAUCET_URL,
    faucetRpcClient,
    queue,
    commitmentsService,
    commitmentsHistoryService,
    syncService,
    tesService,
  );
  return {
    ledgerService,
    evmClientService,
    reset: async () => {
      ledgerService.reset();
      tesService.reset();
      await zeroLedgerDataSource.clear();
      await accountService.reset();
    },
  };
};
