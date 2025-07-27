import { Address } from "viem";
import { EventEmitter } from "node:events";
import debounce from "debounce";
import { FaucetRpc, FaucetRequestDto } from "@src/services/core/faucet.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "@src/services/core/rpc";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "@src/services/core/queue";
import {
  prepareDeposit,
  isUserRegistered,
  prepareSpend,
  type CommitmentStruct,
  watchVault,
  type VaultEvent,
  decodeMetadata,
  decryptCommitment,
  VaultCommitmentCreatedEvent,
  VaultCommitmentRemovedEvent,
  getDepositTxData,
  getSpendTxData,
  getWithdrawTxData,
  getDepositTxGas,
  getSpendTxGas,
  getWithdrawTxGas,
  depositGasSponsoredLimit,
  spendGasSponsoredLimit,
  withdrawGasSponsoredLimit,
} from "@src/utils/vault";
import { catchService } from "@src/services/core/catch.service";
import { TesService } from "@src/services/tes.service";
import CommitmentsService from "./commitments.service";
import CommitmentsHistoryService from "./history.service";
import SyncService from "./sync.service";
import { HistoryRecordDto, LedgerRecordDto } from "./ledger.dto";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { ViewAccountService } from "@src/services/viewAccount.service";
import { compareEvents, EventLike } from "@src/utils/events";
import { logStringify } from "@src/utils/common";
import { createSignedMetaTx, getForwarderNonce } from "@src/utils/metatx";

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
    private readonly viewAccountService: ViewAccountService,
    private readonly clientService: EvmClientService,
    private readonly vault: Address,
    private readonly forwarder: Address,
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
    this.address = this.clientService.writeClient!.account.address;
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

  private async getEncryptionParams(user: Address) {
    const { publicKey: encryptionPublicKey, active: senderActive } =
      await isUserRegistered(user, this.vault, this.clientService.readClient!);
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

        this.logger.log(`e ${logStringify(event)}`);

        let commitment: CommitmentStruct;

        if (tesUrl.length && tesUrl === this.tesService.tesUrl) {
          commitment = await this.tesService.decrypt(
            event.blockNumber!.toString(),
            this.token,
            event.args.poseidonHash!.toString(),
          );
        } else if (tesUrl.length && tesUrl !== this.tesService.tesUrl) {
          const shortLivedTes = new TesService(
            tesUrl,
            this.viewAccountService,
            this.clientService,
            this.queue,
          );
          commitment = await shortLivedTes.decrypt(
            event.blockNumber!.toString(),
            this.token,
            event.args.poseidonHash!.toString(),
          );
        } else {
          this.logger.log(
            `local decryption of encryptedCommitment: ${encryptedCommitment}`,
          );
          commitment = decryptCommitment(
            encryptedCommitment,
            this.viewAccountService.viewPrivateKey()!,
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

  async syncStatus() {
    const currentBlock = await this.clientService.readClient!.getBlockNumber();
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

  async start() {
    // enqueue prevents handleIncomingEventsDebounced to be activated before sync is done,
    // so that old commitments processed before 'real-time' incoming
    await this.enqueue(
      async () => {
        watchVault(this.clientService.readClient!, this.vault, (events) => {
          this.eventsCache.push(...events);
          this.eventsHandlerDebounced();
        });
        const currentBlock =
          await this.clientService.readClient!.getBlockNumber();
        const tesSyncEvents = await this.tesService.syncWithTes(
          this.token,
          await this.syncService.getLastSyncedBlock(),
          currentBlock.toString(),
        );
        this.eventsCache.push(...(tesSyncEvents.events as VaultEvent[]));
        this.logger.log(
          `Update last synced block after tes sync to ${tesSyncEvents.syncedBlock}`,
        );
        await this.syncService.setLastSyncedBlock(tesSyncEvents.syncedBlock);
        const syncEvents = await this.syncService.runOnchainSync(
          this.clientService.readClient!,
          this.vault,
          this.address,
          this.token,
          currentBlock,
        );
        this.eventsCache.push(...syncEvents);
        await this.handleEventsBatch();
      },
      "LedgerService.start",
      240_000,
    );
  }

  deposit(value: bigint) {
    return this.enqueue(
      async () => {
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          this.address,
        );

        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = depositGasSponsoredLimit();
        const fee = gasToCover * gasPrice;

        const { proofData, depositStruct /* depositCommitmentData */ } =
          await prepareDeposit(
            this.token,
            this.address,
            value,
            encryptionPublicKey,
            fee,
            paymasterAddress,
            tesUrl,
          );

        const depositParams = {
          depositStruct,
          client: this.clientService.writeClient!,
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        await approve({
          tokenAddress: depositStruct.token,
          receiverAddress: this.vault,
          amount: depositStruct.total_deposit_amount + depositStruct.fee,
          client: this.clientService.writeClient!,
        });

        const gas = await getDepositTxGas(depositParams);

        this.logger.log(
          `Deposit: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        const metaTransaction = await createSignedMetaTx(
          {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: getDepositTxData(depositStruct, proofData.calldata_proof),
          },
          this.forwarder,
          this.clientService.writeClient!,
        );

        await this.tesService.executeMetaTransaction(
          metaTransaction,
          gasToCover.toString(),
        );
        // await deposit(depositParams);

        return true;
      },
      "LedgerService.deposit",
      480_000,
    );
  }

  partialWithdraw(value: bigint, recipient: Address) {
    return this.enqueue(
      async () => {
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = spendGasSponsoredLimit(1, 3, 2);
        const fee = gasPrice * gasToCover;

        const { selectedCommitmentRecords, totalAmount: totalMovingAmount } =
          await this.commitmentsService.findCommitments(value + fee);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const publicOutputs = [
          { owner: recipient, amount: value },
          {
            owner: paymasterAddress,
            amount: fee,
          },
        ];

        const { encryptionPublicKey, tesUrl } = await this.getEncryptionParams(
          this.address,
        );

        const { proofData, transactionStruct } = await prepareSpend({
          commitments: selectedCommitmentRecords,
          token: this.token,
          totalMovingAmount,
          privateSpendAmount: 0n,
          publicSpendAmount: value + fee,
          spender: this.address,
          spenderEncryptionPublicKey: encryptionPublicKey,
          spenderTesUrl: tesUrl,
          receiver: this.address,
          receiverEncryptionPublicKey: encryptionPublicKey,
          receiverTesUrl: tesUrl,
          publicOutputs,
        });

        const partialWithdrawParams = {
          transactionStruct,
          client: this.clientService.writeClient!,
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        const gas = await getSpendTxGas(partialWithdrawParams);

        this.logger.log(
          `PartialWithdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        const metaTransaction = await createSignedMetaTx(
          {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600,
            data: getSpendTxData(transactionStruct, proofData.calldata_proof),
          },
          this.forwarder,
          this.clientService.writeClient!,
        );

        await this.tesService.executeMetaTransaction(
          metaTransaction,
          gasToCover.toString(),
        );

        // await spend(partialWithdrawParams);

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

        const gasToCover = withdrawGasSponsoredLimit(withdrawItems.length);

        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const withdrawParams = {
          client: this.clientService.writeClient!,
          contract: this.vault,
          token: this.token,
          withdrawItems,
          recipient,
          fee: gasToCover * gasPrice,
          feeRecipient: paymasterAddress,
        };

        const gas = await getWithdrawTxGas(withdrawParams);

        this.logger.log(
          `Withdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        const metaTransaction = await createSignedMetaTx(
          {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: getWithdrawTxData(withdrawParams),
          },
          this.forwarder,
          this.clientService.writeClient!,
        );

        await this.tesService.executeMetaTransaction(
          metaTransaction,
          gasToCover.toString(),
        );

        // await withdraw(withdrawParams);

        return true;
      },
      "LedgerService.withdraw",
      480_000,
    );
  }

  send(value: bigint, recipient: Address) {
    return this.enqueue(
      async () => {
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = spendGasSponsoredLimit(1, 3, 1);
        const fee = gasPrice * gasToCover;
        const { selectedCommitmentRecords, totalAmount } =
          await this.commitmentsService.findCommitments(value + fee);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const publicOutputs = [
          {
            owner: paymasterAddress,
            amount: fee,
          },
        ];

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
          publicSpendAmount: fee,
          spender: this.address,
          spenderEncryptionPublicKey,
          spenderTesUrl,
          receiver: recipient,
          receiverEncryptionPublicKey,
          receiverTesUrl,
          publicOutputs,
        });

        const sendParams = {
          transactionStruct,
          client: this.clientService.writeClient!,
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        const metaTransaction = await createSignedMetaTx(
          {
            from: this.address,
            to: this.vault,
            value: 0,
            gas: await getSpendTxGas(sendParams),
            nonce: await getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: getSpendTxData(transactionStruct, proofData.calldata_proof),
          },
          this.forwarder,
          this.clientService.writeClient!,
        );

        await this.tesService.executeMetaTransaction(
          metaTransaction,
          gasToCover.toString(),
        );

        // await spend(sendParams);

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

  async reset() {
    this.updateBothBalancesDebounced.clear();
    this.eventsHandlerDebounced.clear();
    this.tesService.reset();
  }
}
