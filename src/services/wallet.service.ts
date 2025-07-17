import { Address, Hash, PrivateKeyAccount, zeroAddress } from "viem";
import { EventEmitter } from "node:events";
import { FaucetRpc, FaucetRequestDto } from "@src/services/core/faucet.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "@src/services/core/rpc";
import { CustomClient } from "@src/common.types";
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
} from "@src/utils/vault";
import {
  LedgerRecordDto,
  CommitmentsService,
  CommitmentsHistoryService,
  HistoryRecordDto,
  SyncService,
} from "@src/services/ledger";
import { delay } from "@src/utils/common";
import { catchService } from "@src/services/core/catch.service";
import TesService from "@src/services/core/tes.service";

export const ClientServiceEvents = {
  PRIVATE_BALANCE_CHANGE: "PRIVATE_BALANCE_CHANGE",
  ONCHAIN_BALANCE_CHANGE: "ONCHAIN_BALANCE_CHANGE",
} as const;

export class WalletService extends EventEmitter {
  private readonly address: Address;
  private faucetRpc: ServiceClient<FaucetRpc>;
  private logger = new Logger("WalletService");
  private catchService = catchService;

  constructor(
    private readonly pk: Hash,
    private readonly client: CustomClient,
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
    this.address = this.client.account.address;
    this.faucetRpc = this.faucetRpcClient.getService(this.faucetUrl, {
      namespace: "faucet",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safeEmit(event: keyof typeof ClientServiceEvents, ...args: any[]) {
    try {
      this.emit(event, ...args);
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  private async enqueue<T>(fn: () => Promise<T>) {
    const [err, result] = await this.queue.schedule("walletService", fn);
    if (err) {
      this.catchService.catch(err);
    }
    return result;
  }

  private updateBothBalancesTimeout: NodeJS.Timeout | null = null;

  private async updateBothBalances() {
    // Clear any existing timeout
    if (this.updateBothBalancesTimeout) {
      clearTimeout(this.updateBothBalancesTimeout);
    }

    // Set a new timeout for 500ms
    this.updateBothBalancesTimeout = setTimeout(async () => {
      this.updateBothBalancesTimeout = null; // Clear the reference

      this.safeEmit(
        ClientServiceEvents.PRIVATE_BALANCE_CHANGE,
        await this.getBalance(),
      );
      this.safeEmit(ClientServiceEvents.ONCHAIN_BALANCE_CHANGE);
    }, 500);
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
    try {
      const currentBlock = await this.client.getBlockNumber();
      this.subscribeOnVaultEvents();
      const missedEvents = await this.syncService.runSync(
        this.client,
        this.vault,
        this.address,
        this.token,
        currentBlock,
      );
      await this.handleIncomingEvents(missedEvents);
      return await this.getBalance();
    } catch (error) {
      this.catchService.catch(error as Error);
    }
  }

  async syncStatus() {
    const currentBlock = await this.client.getBlockNumber();
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
    return this.enqueue(async () => {
      const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
        this.address,
      );
      const { proofData, depositStruct /* depositCommitmentData */ } =
        await prepareDeposit(
          this.token,
          this.client,
          value,
          encryptionPublicKey,
          tesUrl,
        );

      const transfer = {
        tokenAddress: depositStruct.token,
        receiverAddress: this.vault,
        amount: depositStruct.total_deposit_amount,
        client: this.client,
      };

      await approve(transfer);
      await deposit({
        depositStruct,
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      return true;
    });
  }

  partialWithdraw(value: bigint, recipient: Address) {
    return this.enqueue(async () => {
      const isRegistered = await isUserRegistered(
        recipient,
        this.vault,
        this.client,
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
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      return true;
    });
  }

  withdraw(recipient: Address) {
    return this.enqueue(async () => {
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
        client: this.client,
        contract: this.vault,
        token: this.token,
        withdrawItems,
        recipient,
      });

      return true;
    });
  }

  private async getEncryptionParams(user: Address) {
    const { publicKey: encryptionPublicKey, active: senderActive } =
      await isUserRegistered(user, this.vault, this.client);
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
    return this.enqueue(async () => {
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
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      return true;
    });
  }

  async faucet(amount: string) {
    return this.enqueue(() =>
      this.faucetRpc.obtainTestTokens(
        new FaucetRequestDto(this.token, this.address, amount, "0.0001"),
      ),
    );
  }

  subscribeOnVaultEvents() {
    const handlerWrapper = async (events: VaultEvent[]) => {
      await this.enqueue(async () => {
        // artificially slow down event processing to increase stability of rpc interactions
        // @todo remove when migrate to fallback rpc logic
        await delay(500);
        await this.handleIncomingEvents(events);
      });
    };
    watchVault(this.client, this.vault, handlerWrapper);
  }

  private async handleIncomingEvents(events: VaultEvent[]) {
    await Promise.all(
      events.map(async (event: VaultEvent) => {
        if (
          event.eventName === "CommitmentCreated" &&
          event.args.owner === this.address &&
          event.args.token === this.token &&
          event.args.metadata
        ) {
          if (!event.blockNumber || !event.transactionIndex) {
            throw new Error("Block number and transaction index are required");
          }
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
              this.client.account as PrivateKeyAccount,
            );
            commitment = await shortLivedTes.decrypt(
              encryptedCommitment,
              this.token,
            );
          } else {
            commitment = decryptCommitment(encryptedCommitment, this.pk);
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
              event.blockNumber.toString(),
              event.transactionIndex,
            ),
          );
          await this.syncService.setLastSyncedBlock(
            event.blockNumber.toString(),
          );
          await this.updateBothBalances();
          return;
        }
        if (
          event.eventName === "CommitmentRemoved" &&
          event.args.owner === this.address &&
          event.args.token === this.token
        ) {
          if (!event.blockNumber || !event.transactionIndex) {
            throw new Error("Block number and transaction index are required");
          }
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
                event.blockNumber.toString(),
                event.transactionIndex,
              ),
            );
          }
          await this.syncService.setLastSyncedBlock(
            event.blockNumber.toString(),
          );
          await this.updateBothBalances();
          return;
        }
      }),
    );
  }
}
