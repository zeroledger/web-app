import { Address, encodeAbiParameters, parseAbiParameters } from "viem";
import { ChallengeResponse, NotifyMessages } from "./client.dto";
import { Axios } from "axios";
import { MemoryQueue } from "../queue";
import { io, Socket } from "socket.io-client";
import { promisify } from "../rpc/utils";
import { Logger } from "@src/utils/logger";
import { catchService } from "../catch/catch.service";
import { EventEmitter } from "node:events";
import { WalletService } from "./wallet.service";
import { CustomClient } from "@src/common.types";
import { TransactionsEntity } from "./transactions.entity";
const SOCKET_AUTH_ABI = parseAbiParameters(
  "address userAddress,bytes signature",
);

export const ClientServiceEvents = {
  OFFCHAIN_BALANCE_CHANGE: "OFFCHAIN_BALANCE_CHANGE",
  ONCHAIN_BALANCE_CHANGE: "ONCHAIN_BALANCE_CHANGE",
} as const;

export class ClientController extends EventEmitter {
  private readonly address: Address;

  private socket?: Socket;

  private readonly logger = new Logger("ClientService");
  private catchService = catchService;

  constructor(
    private readonly axios: Axios,
    private readonly operatorUrl: string,
    private readonly client: CustomClient,
    private readonly queue: MemoryQueue,
    private readonly walletService: WalletService,
    private readonly transactionsEntity: TransactionsEntity,
  ) {
    super();
    this.address = this.client.account.address;
  }

  private async getAuthToken() {
    const { data } = await this.axios.get<ChallengeResponse>(
      `${this.operatorUrl}/challenge/${this.address}`,
    );

    const signature = await this.client.signMessage({
      message: data.random,
    });
    return encodeAbiParameters(SOCKET_AUTH_ABI, [this.address, signature]);
  }

  private async setupConnection(correlationId: UUID) {
    const [error, balance] = await this.queue.schedule(
      `connection:${this.operatorUrl}`,
      async () => {
        const { promise, resolve } = promisify<bigint>();
        if (this.socket) {
          this.logger.log(`Use existing socket`);
          resolve(await this.walletService.getBalance());
          return promise;
        }
        const token = await this.getAuthToken();

        const socket = io(this.operatorUrl, {
          reconnection: false,
          auth: {
            token,
          },
        });

        this.socket = socket;

        socket.on(
          "message",
          async ({ messages }: { messages: NotifyMessages }, callback) => {
            try {
              if (messages.length > 0) {
                await this.walletService.process(messages);
                this.safeEmit(
                  ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
                  await this.walletService.getBalance(),
                );
              }
              callback(true);
            } catch (error) {
              this.catchService.catch(error as Error);
              callback(false);
            }
          },
        );

        const reconnect = async (reason: Socket.DisconnectReason) => {
          try {
            const logger = new Logger("NodeController.setupConnection");
            if (
              reason === "io client disconnect" ||
              reason === "io server disconnect"
            ) {
              logger.log(reason);
              return;
            }
            if (socket.connected) {
              logger.log(`Already connected`);
              return;
            }
            socket.auth = {
              token: await this.getAuthToken(),
            };
            socket.connect();
            socket.once("disconnect", reconnect);
            logger.log(`Connection reopened`);
          } catch (error) {
            this.catchService.catch(error as Error);
          }
        };

        socket.once("disconnect", reconnect);

        socket.once("connect", async () => {
          // @todo: request all messages from the server
          resolve(await this.walletService.getBalance());
        });

        return promise;
      },
      correlationId,
    );

    if (error) {
      throw error;
    }

    return balance;
  }

  async shutdown() {
    const logger = new Logger("NodeController.shutdown");
    const correlationId = crypto.randomUUID();
    this.queue.schedule(
      `connection:${this.operatorUrl}`,
      async () => {
        if (this.socket && this.socket.connected) {
          logger.log(
            `Initiate connection closing, correlationId: ${correlationId}`,
          );
          const { promise, resolve } = promisify<void>();

          this.socket.removeAllListeners("disconnect");
          this.socket.once("disconnect", () => resolve());
          this.socket.close();
          await promise;
        }
        delete this.socket;
        Logger.log(`Connection closed, correlationId: ${correlationId}`);
      },
      correlationId,
    );
  }

  async start() {
    try {
      // const correlationId = crypto.randomUUID();
      // const balance = await this.setupConnection(correlationId);
      // return balance;
      return 0n;
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  async deposit(value: bigint) {
    const success = await this.walletService.deposit(value);

    if (success) {
      this.safeEmit(
        ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
        await this.walletService.getBalance(),
      );
      this.safeEmit(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE);
    }
  }

  async send(value: bigint, recipient: Address) {
    const notifyMessage = await this.walletService.send(value, recipient);

    if (notifyMessage) {
      /**
       * @todo use messageBus to rebroadcast message
       */
      this.logger.log(`Sending notifyMessage`);
      await this.axios.post<void>(`${this.operatorUrl}/notify`, [
        notifyMessage,
      ]);
      this.safeEmit(
        ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
        await this.walletService.getBalance(),
      );
    }
    console.log(`Done`);
  }

  async collaborativeWithdraw() {
    try {
      await this.walletService.collaborativeWithdraw();
      this.safeEmit(ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE, 0n);
      this.safeEmit(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safeEmit(event: keyof typeof ClientServiceEvents, ...args: any[]) {
    try {
      this.emit(event, ...args);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  async getTransactions() {
    return this.transactionsEntity.all();
  }

  async faucet(amount: string) {
    try {
      await this.walletService.faucet(amount);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }
}
