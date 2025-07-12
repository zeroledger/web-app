import { Address } from "viem";
import { Logger } from "@src/utils/logger";
import { catchService } from "@src/services/core/catch.service";
import { EventEmitter } from "node:events";
import { WalletService } from "@src/services/wallet.service";

export const ClientServiceEvents = {
  PRIVATE_BALANCE_CHANGE: "PRIVATE_BALANCE_CHANGE",
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
      // get onchain transactions from indexer
      // (deposits, withdrawals, transfers)
      // decrypt outputs dedicated for this client and update records
      // save deposits, withdrawals, transfers in decrypted form
      // return balance
      this.walletService.subscribeOnVaultEvents(
        {
          onWithdrawal: () => this.updateBothBalances(),
          onTokenDeposited: () => this.updateBothBalances(),
          onTransactionSpent: () => this.updatePrivateBalance(),
        },
        this.catchService.catch,
      );
      return await this.walletService.getBalance();
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  private async updateBothBalances() {
    this.safeEmit(
      ClientServiceEvents.PRIVATE_BALANCE_CHANGE,
      await this.walletService.getBalance(),
    );
    this.safeEmit(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE);
  }

  private async updatePrivateBalance() {
    this.safeEmit(
      ClientServiceEvents.PRIVATE_BALANCE_CHANGE,
      await this.walletService.getBalance(),
    );
  }

  async deposit(value: bigint) {
    const success = await this.walletService.deposit(value);

    if (success) {
      this.updateBothBalances();
    }
  }

  async send(value: bigint, recipient: Address) {
    const success = await this.walletService.send(value, recipient);

    if (success) {
      this.updatePrivateBalance();
    }
  }

  async withdraw(value: bigint, recipient: Address) {
    const balance = await this.walletService.getBalance();

    let success = false;

    if (balance > value) {
      success = await this.walletService.partialWithdraw(value, recipient);
    } else {
      success = await this.walletService.withdraw(recipient);
    }

    if (success) {
      this.updateBothBalances();
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
    return [];
  }

  async faucet(amount: string) {
    try {
      await this.walletService.faucet(amount);
      this.updateBothBalances();
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }
}
