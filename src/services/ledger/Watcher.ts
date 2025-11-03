import { Address, keccak256 } from "viem";
import { EventEmitter } from "node:events";
import debounce from "debounce";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "@src/services/core/queue";
import {
  type CommitmentStruct,
  type VaultEvent,
  type VaultCommitmentCreatedEvent,
  type VaultCommitmentRemovedEvent,
} from "@src/utils/vault/types";
import { decodeMetadata, decryptCommitment } from "@src/utils/vault/metadata";
import { watchVault } from "@src/utils/vault/watcher";
import { catchService } from "@src/services/core/catch.service";
import { type Tes } from "@src/services/Tes";
import type Commitments from "./Commitments";
import CommitmentsHistory from "./CommitmentsHistory";
import SyncService from "./SyncService";
import { HistoryRecordDto, LedgerRecordDto } from "./ledger.dto";
import { EvmClients } from "@src/services/Clients";
import { compareEvents, EventLike } from "@src/utils/events";
import { AxiosInstance } from "axios";
import { LedgerEvents } from "./events";
import { shortString } from "@src/utils/common";
import { v4 as uuidv4 } from "uuid";

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [asyncVaultUtils, { Tes }] = await Promise.all([
    import("@src/utils/vault"),
    import("@src/services/Tes"),
  ]);

  return {
    asyncVaultUtils,
    Tes,
  };
};

export class Watcher extends EventEmitter {
  private logger = new Logger(Watcher.name);
  private catchService = catchService;
  private eventsCache: VaultEvent[] = [];
  private eventsHandlerDebounced: ReturnType<typeof debounce>;
  private updateBothBalancesDebounced: ReturnType<typeof debounce>;
  private preloadedModulesPromise: Promise<{
    asyncVaultUtils: typeof import("@src/utils/vault");
    Tes: typeof import("@src/services/Tes").Tes;
  }>;
  private _unwatchVault?: () => void;
  private classId = keccak256(`0x${uuidv4()}`).slice(0, 8);
  constructor(
    private readonly evmClients: EvmClients,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly queue: MemoryQueue,
    private readonly commitments: Commitments,
    private readonly commitmentsHistory: CommitmentsHistory,
    private readonly syncService: SyncService,
    private readonly tesService: Tes,
    private readonly axios: AxiosInstance,
  ) {
    super();
    this.preloadedModulesPromise = loadHeavyDependencies();
    this.updateBothBalancesDebounced = debounce(
      () => this.updateBothBalances(),
      1000,
    );
    this.eventsHandlerDebounced = debounce(
      () =>
        this.enqueue(
          () => this.handleEventsBatch({ updateBlockNumber: true }),
          `handleEventsBatch`,
          80_000,
        ),
      1000,
    );
    this.logger.log(`Created with token ${this.token}`);
  }

  mainAccount() {
    return this.evmClients.primaryClient()!.account;
  }

  async getForwarder() {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    return await asyncVaultUtils.getTrustedForwarder({
      client: this.evmClients.readClient,
      contract: this.vault,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safeEmit(event: keyof typeof LedgerEvents, ...args: any[]) {
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
    forwardError?: boolean,
  ) {
    const [err, result] = await this.queue.schedule(
      Watcher.name,
      fn,
      `${correlationId}-${this.classId}`,
      timeout,
    );
    if (err) {
      if (forwardError) {
        throw err;
      } else {
        this.catchService.catch(err);
      }
    }
    return result;
  }

  private async updateBothBalances() {
    this.logger.log("updating both balances");
    this.safeEmit(LedgerEvents.PRIVATE_BALANCE_CHANGE, await this.getBalance());
    this.safeEmit(LedgerEvents.ONCHAIN_BALANCE_CHANGE);
  }

  async handleEventsBatch({
    updateBlockNumber = false,
  }: { updateBlockNumber?: boolean } = {}) {
    const events = this.eventsCache.splice(0);
    const mainAccount = this.mainAccount();
    this.logger.log(`handle ${events.length} events batch`);
    const selectedInOrderEvents = events
      .filter(
        (e) =>
          (e.eventName === "CommitmentCreated" ||
            e.eventName === "CommitmentRemoved") &&
          e.args.owner === mainAccount.address &&
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
        const { encryptedCommitment, tesUrl, message } = decodeMetadata(
          event.args.metadata,
        );

        const shortCommitment = shortString(
          BigInt(encryptedCommitment).toString(),
        );

        let commitment: CommitmentStruct | undefined = undefined;

        try {
          if (tesUrl.length && tesUrl === this.tesService.tesUrl) {
            this.logger.log(
              `Decrypting commitment ${shortCommitment} via long default tes instance`,
            );
            commitment = await this.tesService.decrypt(
              event.blockNumber!.toString(),
              this.token,
              event.args.poseidonHash!.toString(),
              mainAccount.address,
            );
          } else if (tesUrl.length && tesUrl !== this.tesService.tesUrl) {
            const { Tes } = await this.preloadedModulesPromise;
            const externalTes = new Tes(
              tesUrl,
              this.tesService.viewAccount,
              this.queue,
              this.axios,
            );
            this.logger.log(
              `Decrypting commitment ${shortCommitment} via external tes instance`,
            );
            commitment = await externalTes.decrypt(
              event.blockNumber!.toString(),
              this.token,
              event.args.poseidonHash!.toString(),
              mainAccount.address,
            );
          } else {
            this.logger.log(
              `Decrypting commitment ${shortCommitment} via private view account key`,
            );
            commitment = decryptCommitment(
              encryptedCommitment,
              this.tesService.viewAccount.viewPrivateKey()!,
            );
          }
        } catch {
          this.catchService.catch(
            new Error(`Fail to decrypt commitment ${shortCommitment}, skip`),
          );
        }

        if (!commitment) {
          continue;
        }

        const ledgerRecord = LedgerRecordDto.from(
          event.args.poseidonHash!,
          commitment.amount,
          commitment.sValue,
        );
        await this.commitments.save(ledgerRecord);
        await this.commitmentsHistory.add(
          new HistoryRecordDto(
            "added",
            event.transactionHash,
            ledgerRecord,
            event.blockNumber!.toString(),
            event.transactionIndex!,
            message || undefined,
          ),
        );
        if (updateBlockNumber) {
          await this.syncService.setLastSyncedBlock(
            event.blockNumber!.toString(),
          );
        }
        this.updateBothBalancesDebounced();
      }
      if (event.eventName === "CommitmentRemoved") {
        // remove commitment from LedgerRecordDto
        const ledgerRecord = await this.commitments.delete(
          event.args.poseidonHash!.toString(),
        );
        if (ledgerRecord) {
          await this.commitmentsHistory.add(
            new HistoryRecordDto(
              "spend",
              event.transactionHash,
              ledgerRecord,
              event.blockNumber!.toString(),
              event.transactionIndex!,
              undefined,
            ),
          );
        }
        if (updateBlockNumber) {
          await this.syncService.setLastSyncedBlock(
            event.blockNumber!.toString(),
          );
        }
        this.updateBothBalancesDebounced();
      }
    }
  }

  async getPaginatedTransactions(
    limit: number,
    cursor?: string,
    hideDecoyTransactions?: boolean,
  ): Promise<{
    transactions: Record<
      string,
      { incomings: HistoryRecordDto[]; outgoings: HistoryRecordDto[] }
    >;
    nextCursor?: string;
  }> {
    let amount = 0;
    let nextCursor: string | undefined;
    try {
      const transactions = {} as Record<
        string,
        { incomings: HistoryRecordDto[]; outgoings: HistoryRecordDto[] }
      >;
      let previousTxHash: string | undefined;
      await this.commitmentsHistory.eachRevert((historyRecord, { prevId }) => {
        const txHash = historyRecord.transactionHash || "unknown";
        nextCursor = prevId;

        if (
          hideDecoyTransactions &&
          previousTxHash &&
          previousTxHash !== txHash
        ) {
          const prevTx = transactions[previousTxHash];
          const isDecoyTransaction =
            prevTx.incomings.length === 1 &&
            prevTx.outgoings.length === 0 &&
            BigInt(prevTx.incomings[0].record.value) === 0n;

          if (isDecoyTransaction) {
            // Remove the decoy transaction and reduce the count
            delete transactions[previousTxHash];
            amount -= 1;
          }
        }

        if (!transactions[txHash]) {
          amount += 1;
          if (amount > limit) {
            return true;
          }
          transactions[txHash] = {
            incomings: [],
            outgoings: [],
          };
        }

        // Categorize based on status
        if (historyRecord.status === "added") {
          transactions[txHash].incomings.push(historyRecord);
        } else if (historyRecord.status === "spend") {
          transactions[txHash].outgoings.push(historyRecord);
        }

        previousTxHash = txHash;
        return false;
      }, cursor);

      return {
        transactions,
        nextCursor: nextCursor,
      };
    } catch (error) {
      this.catchService.catch(error as Error);
      return {
        transactions: {},
      };
    }
  }

  async syncStatus() {
    const currentBlock = await this.evmClients.readClient.getBlockNumber();
    const lastSyncedBlock = BigInt(await this.syncService.getLastSyncedBlock());
    const processedBlock = this.syncService.getProcessedBlock();
    const anchorBlock =
      lastSyncedBlock > processedBlock ? lastSyncedBlock : processedBlock;
    return {
      anchorBlock,
      currentBlock,
    };
  }

  async getBalance() {
    const commitments = await this.commitments.all();
    this.logger.log(`commitments amount: ${commitments.length}`);
    return commitments.reduce((acc, c) => acc + BigInt(c.value), 0n);
  }

  async getConsolidationRatio() {
    const nonZeroCommitments = await this.commitments.getNonZeroCommitments();

    if (nonZeroCommitments.length <= 3) {
      return { ratio: 1, balanceForConsolidation: 0n }; // No consolidation needed
    }

    const totalBalance = nonZeroCommitments.reduce(
      (acc, c) => acc + c.value,
      0n,
    );
    const top3Balance = nonZeroCommitments
      .slice(0, 3)
      .reduce((acc, c) => acc + c.value, 0n);

    if (totalBalance === 0n) {
      return { ratio: 1, balanceForConsolidation: 0n };
    }

    return {
      ratio: Number(top3Balance) / Number(totalBalance),
      balanceForConsolidation: nonZeroCommitments
        .slice(0, 16)
        .reduce((acc, c) => acc + c.value, 0n),
    };
  }

  async start() {
    // enqueue prevents handleIncomingEventsDebounced to be activated before sync is done,
    // so that old commitments processed before 'real-time' incoming
    await this.enqueue(
      async () => {
        this._unwatchVault = watchVault(
          this.evmClients.readClient,
          this.vault,
          (events) => {
            this.eventsCache.push(...events);
            this.eventsHandlerDebounced();
          },
        );
        const currentBlock = await this.evmClients.readClient.getBlockNumber();
        const mainAccount = this.mainAccount();
        const tesSyncEvents = await this.tesService.syncWithTes(
          mainAccount.address,
          this.token,
          await this.syncService.getLastSyncedBlock(),
          currentBlock.toString(),
        );
        this.eventsCache.push(...(tesSyncEvents.events as VaultEvent[]));
        await this.syncService.setLastSyncedBlock(tesSyncEvents.syncedBlock);
        const syncEvents = await this.syncService.runOnchainSync(
          this.evmClients.readClient,
          this.vault,
          mainAccount.address,
          this.token,
          currentBlock,
        );
        this.eventsCache.push(...syncEvents);
        await this.handleEventsBatch();
        await this.updateBothBalances();
      },
      "start",
      240_000,
    );
  }

  softReset() {
    return this.enqueue(async () => {
      this._unwatchVault?.();
      this.updateBothBalancesDebounced.clear();
      this.eventsHandlerDebounced.clear();
      this.eventsCache = [];
      this.tesService.reset();
    }, "softReset");
  }

  async reset() {
    await this.softReset();
    this.commitments.reset();
    this.commitmentsHistory.reset();
    this.syncService.reset();
  }
}
