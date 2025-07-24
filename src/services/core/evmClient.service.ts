import {
  Chain,
  createWalletClient,
  fallback,
  http,
  publicActions,
  webSocket,
  Transport,
  WalletClient,
  RpcSchema,
  PublicClient,
  PrivateKeyAccount,
} from "viem";
import { AccountService } from "@src/services/ledger/accounts.service";
import { SocketRpcClient } from "viem/utils";

export type CustomClient = PublicClient<
  Transport,
  Chain,
  PrivateKeyAccount,
  RpcSchema
> &
  WalletClient<Transport, Chain, PrivateKeyAccount, RpcSchema>;

export class EvmClientService {
  public readonly client: CustomClient;

  constructor(
    wsUrl: string,
    httpUrl: string,
    pollingInterval: number,
    accountService: AccountService,
    chain: Chain,
  ) {
    const transport = fallback([webSocket(wsUrl), http(httpUrl), http()]);
    this.client = createWalletClient({
      account: accountService.getMainAccount() as PrivateKeyAccount,
      chain,
      transport,
      pollingInterval,
    }).extend(publicActions);
  }

  close() {
    for (let i = 0; i < this.client.transport?.transports?.length; i++) {
      const { value } = this.client.transport.transports[i];
      if (value.getRpcClient) {
        value
          .getRpcClient()
          .then((rpc: SocketRpcClient<WebSocket>) => rpc.close());
      }
    }
  }
}
