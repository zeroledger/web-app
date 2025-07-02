import { type Hex } from "viem";
import { Axios } from "axios";
import {
  TOKEN_ADDRESS,
  FAUCET_URL,
  VAULT_ADDRESS,
} from "@src/common.constants";

import { JsonRpcClient } from "./rpc";
import { MemoryQueue } from "./queue";
import { ClientController } from "./client/client.controller";
import { FaucetRpc } from "./client/client.dto";
import { WalletService } from "./client/wallet.service";
import { CustomClient } from "@src/common.types";
import { DecoyRecordsEntity } from "./client/records.entity";
import { DataSource } from "./db/leveldb.service";

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
  const queue = new MemoryQueue();

  const faucetRpcClient = new JsonRpcClient<FaucetRpc>(
    axiosInstance,
    client.account.address,
  );

  const records = new DecoyRecordsEntity(new DataSource());

  _clientController = new ClientController(
    new WalletService(
      client,
      VAULT_ADDRESS,
      TOKEN_ADDRESS,
      FAUCET_URL,
      faucetRpcClient,
      queue,
      records,
    ),
  );

  _client = client;
  _pk = pk;

  return _clientController;
};
