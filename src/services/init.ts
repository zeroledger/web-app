import { type Hex } from "viem";
import { Axios } from "axios";
import {
  COORDINATOR_URL,
  DEEP_HASH_ADDRESS,
  OPERATOR_URL,
  TOKEN_ADDRESS,
} from "@src/common.constants";

import { JsonRpcClient } from "./rpc";
import { MemoryQueue } from "./queue";
import { ClientController } from "./client/client.controller";
import { DataSource } from "./db/leveldb.service";
import { PryxRecordsEntity } from "./pryx/pryx.entity";
import { CoordinatorRpc } from "./client/client.dto";
import { WalletService } from "./client/wallet.service";
import { PryxService } from "./pryx/pryx.service";
import { CustomClient } from "@src/common.types";
import { TransactionsEntity } from "./client/transactions.entity";

let _client: CustomClient | undefined;
let _pk: Hex | undefined;
let _clientController: ClientController | undefined;

/**
 * @todo use useMemo instead
 */
export const create = (axiosInstance: Axios, client: CustomClient, pk: Hex) => {
  if (pk == "0x0") {
    return;
  }

  if (_client === client && _pk === pk) {
    return _clientController as ClientController;
  }
  const dataSource = new DataSource();
  const pryxRecordsEntity = new PryxRecordsEntity(dataSource);
  const queue = new MemoryQueue();
  const coordinatorRpcClient = new JsonRpcClient<CoordinatorRpc>(
    axiosInstance,
    client.account.address,
  );

  const transactionsEntity = new TransactionsEntity(dataSource);

  _clientController = new ClientController(
    axiosInstance,
    OPERATOR_URL,
    client,
    queue,
    new WalletService(
      client,
      DEEP_HASH_ADDRESS,
      TOKEN_ADDRESS,
      COORDINATOR_URL,
      new PryxService(client, DEEP_HASH_ADDRESS),
      pryxRecordsEntity,
      coordinatorRpcClient,
      transactionsEntity,
      queue,
    ),
    transactionsEntity,
  );

  _client = client;
  _pk = pk;

  return _clientController;
};
