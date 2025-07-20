import { Address, zeroAddress } from "viem";
import { EventEmitter } from "node:events";
import debounce from "debounce";
import { FaucetRpc, FaucetRequestDto } from "@src/services/core/faucet.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "@src/services/core/rpc";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "@src/services/core/queue";
import {
  prepareDeposit,
  deposit,
  isUserRegistered,
  prepareSpend,
  spend,
  withdraw,
  type CommitmentStruct,
  watchVault,
  type VaultEvent,
  decodeMetadata,
  decryptCommitment,
  VaultCommitmentCreatedEvent,
  VaultCommitmentRemovedEvent,
} from "@src/utils/vault";
import { catchService } from "@src/services/core/catch.service";
import TesService from "@src/services/core/tes.service";
import CommitmentsService from "./commitments.service";
import CommitmentsHistoryService from "./history.service";
import SyncService from "./sync.service";
import { HistoryRecordDto, LedgerRecordDto } from "./ledger.dto";
import { EvmClientService } from "../core/evmClient.service";
import { AccountService } from "./accounts.service";
import { compareEvents, EventLike } from "@src/utils/events";

export const LedgerServiceEvents = {
  PRIVATE_BALANCE_CHANGE: "PRIVATE_BALANCE_CHANGE",
  ONCHAIN_BALANCE_CHANGE: "ONCHAIN_BALANCE_CHANGE",
} as const;

export class LedgerService extends EventEmitter {
  private readonly address: Address;
  private faucetRpc: ServiceClient<FaucetRpc>;
  private logger = new Logger("WalletService");
  private catchService = catchService;
  private eventsCache: VaultEvent[] = [];
  private eventsHandlerDebounced: ReturnType<typeof debounce>;
  private updateBothBalancesDebounced: ReturnType<typeof debounce>;

  constructor(
    private readonly accountService: AccountService,
    private readonly clientService: EvmClientService,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly faucetUrl: string,
    private readonly faucetRpcClient: JsonRpcClient<FaucetRpc>,
    private readonly queue: MemoryQueue,
    private readonly commitmentsService: CommitmentsService,
    private readonly commitmentsHistoryService: CommitmentsHistoryService,
    private readonly syncService: SyncService,
    private readonly tesService: TesService,
  ) {
    super();
    this.address = this.clientService.client.account.address;
    this.faucetRpc = this.faucetRpcClient.getService(this.faucetUrl, {
      namespace: "faucet",
    });
    this.updateBothBalancesDebounced = debounce(() =>
      this.updateBothBalances(),
    );
    this.eventsHandlerDebounced = debounce(
      () =>
        this.enqueue(
          () => this.handleEventsBatch(),
          "LedgerService.handleEventsBatch",
          80_000,
        ),
      1000,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safeEmit(event: keyof typeof LedgerServiceEvents, ...args: any[]) {
    try {
      this.emit(event, ...args);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  private async enqueue<T>(
    fn: () => Promise<T>,
    correlationId?: string,
    timeout?: number,
  ) {
    const [err, result] = await this.queue.schedule(
      "walletService",
      fn,
      correlationId,
      timeout,
    );
    if (err) {
      this.catchService.catch(err);
    }
    return result;
  }

  private async updateBothBalances() {
    this.safeEmit(
      LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
      await this.getBalance(),
    );
    this.safeEmit(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE);
  }

  async getTransactions() {
    try {
      const transactions = await this.commitmentsHistoryService.all();

      // Group transactions by transaction hash and categorize as incomings/outgoings
      const groupedTransactions = transactions.reduce(
        (groups, transaction) => {
          const txHash = transaction.transactionHash || "unknown";

          if (!groups[txHash]) {
            groups[txHash] = {
              incomings: [],
              outgoings: [],
            };
          }

          // Categorize based on status
          if (transaction.status === "added") {
            groups[txHash].incomings.push(transaction);
          } else if (transaction.status === "spend") {
            groups[txHash].outgoings.push(transaction);
          }

          return groups;
        },
        {} as Record<
          string,
          { incomings: typeof transactions; outgoings: typeof transactions }
        >,
      );

      return groupedTransactions;
    } catch (error) {
      this.catchService.catch(error as Error);
      return {};
    }
  }

  async start() {
    // enqueue prevents handleIncomingEventsDebounced to be activated before sync is done,
    // so that old commitments processed before 'real-time' incoming
    await this.enqueue(
      async () => {
        watchVault(this.clientService.client, this.vault, (events) => {
          this.eventsCache.push(...events);
          this.eventsHandlerDebounced();
        });
        const syncEvents = await this.syncService.runSync(
          this.clientService.client,
          this.vault,
          this.address,
          this.token,
          await this.clientService.client.getBlockNumber(),
        );
        this.eventsCache.push(...syncEvents);
        await this.handleEventsBatch();
      },
      "LedgerService.start",
      240_000,
    );
  }

  async syncStatus() {
    const currentBlock = await this.clientService.client.getBlockNumber();
    const processedBlock = this.syncService.getProcessedBlock();
    return {
      processedBlock,
      currentBlock,
    };
  }

  async getBalance() {
    const commitments = await this.commitmentsService.all();
    return commitments.reduce((acc, c) => acc + BigInt(c.value), 0n);
  }

  deposit(value: bigint) {
    return this.enqueue(
      async () => {
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          this.address,
        );
        const { proofData, depositStruct /* depositCommitmentData */ } =
          await prepareDeposit(
            this.token,
            this.clientService.client,
            value,
            encryptionPublicKey,
            tesUrl,
          );

        const transfer = {
          tokenAddress: depositStruct.token,
          receiverAddress: this.vault,
          amount: depositStruct.total_deposit_amount,
          client: this.clientService.client,
        };

        await approve(transfer);
        await deposit({
          depositStruct,
          client: this.clientService.client,
          contract: this.vault,
          proof: proofData.calldata_proof,
        });

        return true;
      },
      "LedgerService.deposit",
      480_000,
    );
  }

  partialWithdraw(value: bigint, recipient: Address) {
    return this.enqueue(
      async () => {
        const isRegistered = await isUserRegistered(
          recipient,
          this.vault,
          this.clientService.client,
        );
        if (!isRegistered) {
          this.logger.error("Recipient PEPK is not registered");
          // throw new Error("User is not registered");
        }

        const publicOutputs = [{ owner: recipient, amount: value }];

        const { selectedCommitmentRecords, totalAmount } =
          await this.commitmentsService.findCommitments(value);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const { encryptionPublicKey, tesUrl } = await this.getEncryptionParams(
          this.address,
        );

        const { proofData, transactionStruct } = await prepareSpend({
          commitments: selectedCommitmentRecords,
          token: this.token,
          totalMovingAmount: totalAmount,
          privateSpendAmount: 0n,
          publicSpendAmount: value,
          spender: this.address,
          spenderEncryptionPublicKey: encryptionPublicKey,
          spenderTesUrl: tesUrl,
          receiver: this.address,
          receiverEncryptionPublicKey: encryptionPublicKey,
          receiverTesUrl: tesUrl,
          publicOutputs,
        });

        await spend({
          transactionStruct,
          client: this.clientService.client,
          contract: this.vault,
          proof: proofData.calldata_proof,
        });

        return true;
      },
      "LedgerService.partialWithdraw",
      480_000,
    );
  }

  withdraw(recipient: Address) {
    return this.enqueue(
      async () => {
        const commitments = await this.commitmentsService.all();

        const withdrawItems: CommitmentStruct[] = [];
        const withdrawItemIds: string[] = [];
        commitments.forEach((c) => {
          if (BigInt(c.value) === 0n) {
            return;
          }
          withdrawItems.push({
            amount: BigInt(c.value),
            sValue: BigInt(c.sValue),
          });
          withdrawItemIds.push(c.hash);
        });

        if (withdrawItems.length === 0) {
          return false;
        }

        await withdraw({
          client: this.clientService.client,
          contract: this.vault,
          token: this.token,
          withdrawItems,
          recipient,
        });

        return true;
      },
      "LedgerService.withdraw",
      480_000,
    );
  }

  private async getEncryptionParams(user: Address) {
    const { publicKey: encryptionPublicKey, active: senderActive } =
      await isUserRegistered(user, this.vault, this.clientService.client);
    if (!senderActive) {
      this.logger.warn(
        `${user} PEPK is not registered, getting trusted encryption token`,
      );
      return {
        encryptionPublicKey: await this.tesService.getTrustedEncryptionToken(),
        tesUrl: this.tesService.tesUrl,
      };
    } else {
      return { encryptionPublicKey };
    }
  }

  send(value: bigint, recipient: Address) {
    return this.enqueue(
      async () => {
        const publicOutputs = [{ owner: zeroAddress, amount: 0n }];

        const { selectedCommitmentRecords, totalAmount } =
          await this.commitmentsService.findCommitments(value);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const {
          encryptionPublicKey: spenderEncryptionPublicKey,
          tesUrl: spenderTesUrl,
        } = await this.getEncryptionParams(this.address);

        const {
          encryptionPublicKey: receiverEncryptionPublicKey,
          tesUrl: receiverTesUrl,
        } = await this.getEncryptionParams(recipient);

        const { proofData, transactionStruct } = await prepareSpend({
          commitments: selectedCommitmentRecords,
          token: this.token,
          totalMovingAmount: totalAmount,
          privateSpendAmount: value,
          publicSpendAmount: 0n,
          spender: this.address,
          spenderEncryptionPublicKey,
          spenderTesUrl,
          receiver: recipient,
          receiverEncryptionPublicKey,
          receiverTesUrl,
          publicOutputs,
        });

        await spend({
          transactionStruct,
          client: this.clientService.client,
          contract: this.vault,
          proof: proofData.calldata_proof,
        });

        return true;
      },
      "LedgerService.send",
      480_000,
    );
  }

  async faucet(amount: string) {
    return this.enqueue(
      () =>
        this.faucetRpc.obtainTestTokens(
          new FaucetRequestDto(this.token, this.address, amount, "0.0001"),
        ),
      "LedgerService.faucet",
      480_000,
    );
  }

  reset() {
    this.updateBothBalancesDebounced.clear();
    this.eventsHandlerDebounced.clear();
  }

  private async handleEventsBatch() {
    const events = this.eventsCache.splice(0);
    this.logger.log(`handle ${events.length} events batch`);
    const selectedInOrderEvents = events
      .filter(
        (e) =>
          (e.eventName === "CommitmentCreated" ||
            e.eventName === "CommitmentRemoved") &&
          e.args.owner === this.address &&
          e.args.token === this.token &&
          typeof e.blockNumber === "bigint" &&
          typeof e.transactionIndex === "number",
      )
      .sort((e0, e1) => {
        const compareResult = compareEvents(e0 as EventLike, e1 as EventLike);
        if (compareResult !== 0) {
          return -1 * compareResult;
        }
        return compareResult;
      }) as (VaultCommitmentCreatedEvent | VaultCommitmentRemovedEvent)[];

    for (let i = 0; i < selectedInOrderEvents.length; i++) {
      const event = selectedInOrderEvents[i];
      if (event.eventName === "CommitmentCreated" && event.args.metadata) {
        // add commitment to LedgerRecordDto
        const { encryptedCommitment, tesUrl } = decodeMetadata(
          event.args.metadata,
        );

        this.logger.log(`encryptedCommitment: ${encryptedCommitment}`);

        let commitment: CommitmentStruct;

        if (tesUrl.length && tesUrl === this.tesService.tesUrl) {
          commitment = await this.tesService.decrypt(
            encryptedCommitment,
            this.token,
          );
        } else if (tesUrl.length && tesUrl !== this.tesService.tesUrl) {
          const shortLivedTes = new TesService(
            tesUrl,
            this.accountService,
            this.queue,
          );
          commitment = await shortLivedTes.decrypt(
            encryptedCommitment,
            this.token,
          );
        } else {
          commitment = decryptCommitment(
            encryptedCommitment,
            this.accountService.viewPrivateKey()!,
          );
        }

        const ledgerRecord = LedgerRecordDto.from(
          event.args.poseidonHash!,
          commitment.amount,
          commitment.sValue,
        );
        await this.commitmentsService.save(ledgerRecord);
        await this.commitmentsHistoryService.add(
          new HistoryRecordDto(
            "added",
            event.transactionHash,
            ledgerRecord,
            event.blockNumber!.toString(),
            event.transactionIndex!,
          ),
        );
        await this.syncService.setLastSyncedBlock(
          event.blockNumber!.toString(),
        );
        this.updateBothBalancesDebounced();
      }
      if (event.eventName === "CommitmentRemoved") {
        // remove commitment from LedgerRecordDto
        const ledgerRecord = await this.commitmentsService.delete(
          event.args.poseidonHash!.toString(),
        );
        if (ledgerRecord) {
          await this.commitmentsHistoryService.add(
            new HistoryRecordDto(
              "spend",
              event.transactionHash,
              ledgerRecord,
              event.blockNumber!.toString(),
              event.transactionIndex!,
            ),
          );
        }
        await this.syncService.setLastSyncedBlock(
          event.blockNumber!.toString(),
        );
        this.updateBothBalancesDebounced();
      }
    }
  }
}
