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

export type PrimaryClientOptions = {
  account: Account | Address;
  provider?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type EmbeddedClientOptions = {
  account: Account;
  provider: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type CustomClient = PublicClient<Transport, Chain, Account, RpcSchema> &
  WalletClient<Transport, Chain, Account, RpcSchema>;

export class EvmClients {
  public readonly readClient: PublicClient;
  private _primaryClient?: CustomClient;
  private _embeddedClient?: CustomClient;
  private readonly transport: Transport;
  private readonly logger = new Logger(EvmClients.name);

  constructor(
    private readonly wsUrls: string[],
    private readonly httpUrls: string[],
    private readonly pollingInterval: number,
    private readonly chain: Chain,
  ) {
    this.transport = fallback([
      ...this.wsUrls.map((wss) => webSocket(wss)),
      ...this.httpUrls.map((url) => http(url)),
    ]);
    this.readClient = createClient({
      chain: this.chain,
      transport: this.transport,
      pollingInterval: this.pollingInterval,
    }).extend(publicActions);
  }

  setEmbeddedClient(embeddedClientOptions: EmbeddedClientOptions) {
    const client = createWalletClient({
      account: embeddedClientOptions.account,
      chain: this.chain,
      transport: custom(embeddedClientOptions.provider),
    }).extend(publicActions);

    this.logger.log(
      `init embedded client for ${
        typeof embeddedClientOptions.account === "object"
          ? embeddedClientOptions.account.address
          : embeddedClientOptions.account
      }`,
    );
    this._embeddedClient = client;
    return client;
  }

  setPrimaryClient(primaryClientOptions: PrimaryClientOptions) {
    if (primaryClientOptions.provider) {
      this._primaryClient = createWalletClient({
        account: primaryClientOptions.account,
        chain: this.chain,
        transport: custom(primaryClientOptions.provider),
      }).extend(publicActions);
    } else {
      this._primaryClient = createWalletClient({
        account: primaryClientOptions.account,
        chain: this.chain,
        transport: this.transport,
      }).extend(publicActions);
    }

    this.logger.log(
      `init primary client for ${
        typeof primaryClientOptions.account === "object"
          ? primaryClientOptions.account.address
          : primaryClientOptions.account
      }`,
    );
    return this._primaryClient;
  }

  primaryClient() {
    return this._primaryClient;
  }

  embeddedClient() {
    return this._embeddedClient;
  }

  async close() {
    /**
     * @dev do not need to close ws connections since viem clients maintain them automatically
     */
    this._primaryClient = undefined;
    this._embeddedClient = undefined;
  }
}
