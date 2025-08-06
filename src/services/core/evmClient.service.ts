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

export class EvmClientService {
  private _readClient?: PublicClient;
  private _writeClient?: CustomClient;

  get readClient() {
    return this._readClient;
  }

  get writeClient() {
    return this._writeClient;
  }

  constructor(
    private readonly wsUrl: string,
    private readonly httpUrl: string,
    private readonly pollingInterval: number,
    private readonly chain: Chain,
    private readonly wallet: ConnectedWallet,
  ) {}

  async open() {
    const provider = await this.wallet.getEthereumProvider();
    this._writeClient = createWalletClient({
      account: this.wallet.address as Address,
      chain: this.chain,
      transport: custom(provider),
    }).extend(publicActions);
    const transport = fallback([
      webSocket(this.wsUrl),
      http(this.httpUrl),
      http(),
    ]);
    this._readClient = createClient({
      chain: this.chain,
      transport,
      pollingInterval: this.pollingInterval,
    }).extend(publicActions);
    return this;
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
