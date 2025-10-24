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
import { Logger } from "@src/utils/logger";

export type ExternalClientOptions = {
  account: Account | Address;
  provider: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

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
    private readonly externalClientOptions: ExternalClientOptions,
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

  _initExternalClient() {
    const client = createWalletClient({
      account: this.externalClientOptions.account,
      chain: this.chain,
      transport: custom(this.externalClientOptions.provider),
    }).extend(publicActions);

    this.logger.log(
      `init external client for ${
        typeof this.externalClientOptions.account === "object"
          ? this.externalClientOptions.account.address
          : this.externalClientOptions.account
      }`,
    );
    return client;
  }

  externalClient() {
    if (!this._externalClient) {
      this._externalClient = this._initExternalClient();
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
