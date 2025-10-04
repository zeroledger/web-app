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
import { ConnectedWallet } from "@privy-io/react-auth";
import { Logger } from "@src/utils/logger";

export type CustomClient = PublicClient<Transport, Chain, Account, RpcSchema> &
  WalletClient<Transport, Chain, Account, RpcSchema>;

export class EvmClients {
  public readonly readClient: PublicClient;
  private _externalClient?: CustomClient;
  private readonly logger = new Logger(EvmClients.name);

  constructor(
    private readonly wsUrls: string[],
    private readonly httpUrls: string[],
    private readonly pollingInterval: number,
    private readonly chain: Chain,
    private readonly wallet: ConnectedWallet,
  ) {
    const transport = fallback([
      ...this.wsUrls.map((wss) => webSocket(wss)),
      ...this.httpUrls.map((url) => http(url)),
    ]);
    this.readClient = createClient({
      chain: this.chain,
      transport,
      pollingInterval: this.pollingInterval,
    }).extend(publicActions);
  }

  async _initExternalClient() {
    const provider = await this.wallet.getEthereumProvider();
    const client = createWalletClient({
      account: this.wallet.address as Address,
      chain: this.chain,
      transport: custom(provider),
    }).extend(publicActions);
    return client;
  }

  async externalClient() {
    if (!this._externalClient) {
      this._externalClient = await this._initExternalClient();
    }
    return this._externalClient;
  }

  async close() {
    /**
     * @dev do not need to close ws connections since viem clients maintain them automatically
     */
    this._externalClient = undefined;
  }
}
