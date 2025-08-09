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

export class EvmClientService {
  private _readClient?: PublicClient;
  private _writeClient?: CustomClient;
  private readonly logger = new Logger(EvmClientService.name);

  get readClient() {
    return this._readClient;
  }

  get writeClient() {
    return this._writeClient;
  }

  constructor(
    private readonly wsUrls: string[],
    private readonly httpUrls: string[],
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
    // const x = webSocket();
    const transport = fallback([
      ...this.wsUrls.map((wss) => webSocket(wss)),
      ...this.httpUrls.map((url) => http(url)),
      http(),
    ]);
    this._readClient = createClient({
      chain: this.chain,
      transport,
      pollingInterval: this.pollingInterval,
    }).extend(publicActions);
    return this;
  }

  async close() {
    /**
     * @dev do not need to close since clients maintain connection automatically
     */
  }
}
