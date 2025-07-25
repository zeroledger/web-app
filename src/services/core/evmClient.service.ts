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
  Account,
  createClient,
  custom,
  Address,
} from "viem";
import { SocketRpcClient } from "viem/utils";
import { ConnectedWallet } from "@privy-io/react-auth";

export type CustomClient = PublicClient<Transport, Chain, Account, RpcSchema> &
  WalletClient<Transport, Chain, Account, RpcSchema>;

type OpenParams = {
  wsUrl: string;
  httpUrl: string;
  pollingInterval: number;
  chain: Chain;
  wallet: ConnectedWallet;
};

export class EvmClientService {
  private _readClient?: PublicClient;
  private _writeClient?: CustomClient;

  get readClient() {
    return this._readClient;
  }

  get writeClient() {
    return this._writeClient;
  }

  async open({ wsUrl, httpUrl, pollingInterval, chain, wallet }: OpenParams) {
    const provider = await wallet.getEthereumProvider();
    this._writeClient = createWalletClient({
      account: wallet.address as Address,
      chain,
      transport: custom(provider),
    }).extend(publicActions);
    const transport = fallback([webSocket(wsUrl), http(httpUrl), http()]);
    this._readClient = createClient({
      chain,
      transport,
      pollingInterval,
    }).extend(publicActions);
  }

  close() {
    for (let i = 0; i < this._readClient?.transport?.transports?.length; i++) {
      const { value } = this._readClient!.transport.transports[i];
      if (value.getRpcClient) {
        value
          .getRpcClient()
          .then((rpc: SocketRpcClient<WebSocket>) => rpc.close());
      }
    }
  }
}
