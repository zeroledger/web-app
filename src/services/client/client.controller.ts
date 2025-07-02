import { Address } from "viem";
import { Logger } from "@src/utils/logger";
import { catchService } from "../catch/catch.service";
import { EventEmitter } from "node:events";
import { WalletService } from "./wallet.service";

export const ClientServiceEvents = {
  OFFCHAIN_BALANCE_CHANGE: "OFFCHAIN_BALANCE_CHANGE",
  ONCHAIN_BALANCE_CHANGE: "ONCHAIN_BALANCE_CHANGE",
} as const;

export class ClientController extends EventEmitter {
  private readonly logger = new Logger("ClientService");
  private catchService = catchService;

  constructor(private readonly walletService: WalletService) {
    super();
  }

  async start() {
    try {
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
    this.logger.log(value, recipient);

    this.safeEmit(
      ClientServiceEvents.OFFCHAIN_BALANCE_CHANGE,
      await this.walletService.getBalance(),
    );
    console.log(`Done`);
  }

  async collaborativeWithdraw() {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safeEmit(event: keyof typeof ClientServiceEvents, ...args: any[]) {
    try {
      this.emit(event, ...args);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  async getTransactions() {
    return [];
  }

  async faucet(amount: string) {
    try {
      await this.walletService.faucet(amount);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }
}
