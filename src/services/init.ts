import { PrivateKeyAccount, type Hex } from "viem";
import { Axios } from "axios";
import {
  TOKEN_ADDRESS,
  FAUCET_URL,
  VAULT_ADDRESS,
  TES_URL,
} from "@src/common.constants";

import { JsonRpcClient } from "@src/services/core/rpc";
import { MemoryQueue } from "@src/services/core/queue";
import { FaucetRpc } from "@src/services/core/faucet.dto";
import { WalletService } from "@src/services/wallet.service";
import { CustomClient } from "@src/common.types";
import {
  CommitmentsHistoryService,
  CommitmentsService,
  SyncService,
} from "@src/services/ledger";
import { DataSource } from "./core/db/leveldb.service";
import TesService from "./core/tes.service";

let _client: CustomClient | undefined;
let _pk: Hex | undefined;
let _walletService: WalletService | undefined;

/**
 * @todo use useMemo instead
 */
export const create = (axiosInstance: Axios, client: CustomClient, pk: Hex) => {
  if (pk == "0x0") {
    return;
  }

  if (_client === client && _pk === pk) {
    return _walletService as WalletService;
  }
  const queue = new MemoryQueue();

  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    client.account.address,
  );

  const zeroLEdgerDataSource = new DataSource();

  const commitmentsService = new CommitmentsService(zeroLEdgerDataSource);
  const commitmentsHistoryService = new CommitmentsHistoryService(
    zeroLEdgerDataSource,
  );
  const syncService = new SyncService(zeroLEdgerDataSource);
  const tesService = new TesService(
    TES_URL,
    client.account as PrivateKeyAccount,
  );
  _walletService = new WalletService(
    pk,
    client,
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

  _client = client;
  _pk = pk;

  return _walletService;
};
