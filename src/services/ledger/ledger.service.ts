import { Address, formatEther, parseEther } from "viem";
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
import {
  createSignedMetaTx,
  getForwarderNonce,
  UnsignedMetaTransaction,
} from "@src/utils/metatx";
import { AxiosInstance } from "axios";
import { computePoseidon } from "@src/utils/poseidon";

export const LedgerServiceEvents = {
  PRIVATE_BALANCE_CHANGE: "PRIVATE_BALANCE_CHANGE",
  ONCHAIN_BALANCE_CHANGE: "ONCHAIN_BALANCE_CHANGE",
} as const;

export type TransactionDetails = {
  type: "deposit" | "partialWithdraw" | "withdraw" | "send";
  vaultContract: Address;
  token: Address;
  from: Address;
  to: Address;
  value: bigint;
  fee: bigint;
  paymaster: Address;
  inputs: bigint[];
  outputs: bigint[];
};

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
    private readonly axios: AxiosInstance,
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
    forwardError?: boolean,
  ) {
    const [err, result] = await this.queue.schedule(
      "walletService",
      fn,
      correlationId,
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
            this.axios,
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

  prepareDepositMetaTransaction(value: bigint) {
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
            value - fee,
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
          amount: value,
          client: this.clientService.writeClient!,
        });

        const gas = await getDepositTxGas(depositParams);

        this.logger.log(
          `Deposit: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
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
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "deposit",
            vaultContract: this.vault,
            token: this.token,
            from: this.address,
            to: this.address,
            value: value - fee,
            fee: fee,
            paymaster: paymasterAddress,
            inputs: [],
            outputs: await Promise.all(
              depositStruct.depositCommitmentParams.map(
                (item) => item.poseidonHash,
              ),
            ),
          } as TransactionDetails,
        };
      },
      "LedgerService.prepareDepositMetaTransaction",
      480_000,
    );
  }

  deposit(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const signedMetaTransaction = await createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          this.clientService.writeClient!,
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
        );
      },
      "LedgerService.deposit",
      80_000,
      true,
    );
  }
  preparePartialWithdrawMetaTransaction(value: bigint, recipient: Address) {
    return this.enqueue(
      async () => {
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = spendGasSponsoredLimit(1, 3, 2);
        const fee = gasPrice * gasToCover;

        const { selectedCommitmentRecords, totalAmount: totalMovingAmount } =
          await this.commitmentsService.findCommitments(value);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const publicOutputs = [
          { owner: recipient, amount: value - fee },
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

        return {
          metaTransaction: {
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
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "partialWithdraw",
            vaultContract: this.vault,
            token: this.token,
            from: this.address,
            to: recipient,
            value: value - fee,
            fee: fee,
            paymaster: paymasterAddress,
            inputs: transactionStruct.inputsPoseidonHashes,
            outputs: transactionStruct.outputsPoseidonHashes,
          } as TransactionDetails,
        };
      },
      "LedgerService.preparePartialWithdrawMetaTransaction",
      480_000,
    );
  }

  partialWithdraw(
    metaTransaction: UnsignedMetaTransaction,
    coveredGas: string,
  ) {
    return this.enqueue(
      async () => {
        const signedMetaTransaction = await createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          this.clientService.writeClient!,
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
        );
      },
      "LedgerService.partialWithdraw",
      80_000,
      true,
    );
  }

  prepareWithdrawMetaTransaction(recipient: Address) {
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
          throw new Error("No commitments found to cover the requested amount");
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

        return {
          metaTransaction: {
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
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "withdraw",
            vaultContract: withdrawParams.contract,
            from: this.address,
            to: withdrawParams.recipient,
            value: withdrawParams.withdrawItems.reduce(
              (acc, item) => acc + item.amount,
              0n,
            ),
            token: withdrawParams.token,
            fee: withdrawParams.fee,
            paymaster: withdrawParams.feeRecipient,
            inputs: await Promise.all(
              withdrawParams.withdrawItems.map((item) =>
                computePoseidon({ amount: item.amount, entropy: item.sValue }),
              ),
            ),
            outputs: [],
          } as TransactionDetails,
        };
      },
      "LedgerService.prepareWithdrawMetaTransaction",
      480_000,
    );
  }

  withdraw(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const signedMetaTransaction = await createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          this.clientService.writeClient!,
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
        );
      },
      "LedgerService.withdraw",
      80_000,
      true,
    );
  }

  prepareSendMetaTransaction(value: bigint, recipient: Address) {
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

        return {
          metaTransaction: {
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
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "send",
            vaultContract: this.vault,
            from: this.address,
            to: recipient,
            value: value,
            fee: fee,
            paymaster: paymasterAddress,
            inputs: transactionStruct.inputsPoseidonHashes,
            outputs: transactionStruct.outputsPoseidonHashes,
          } as TransactionDetails,
        };
      },
      "LedgerService.prepareSendMetaTransaction",
      480_000,
    );
  }

  send(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const signedMetaTransaction = await createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          this.clientService.writeClient!,
        );
        return this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
        );
      },
      "LedgerService.send",
      80_000,
      true,
    );
  }

  async faucet(amount: string) {
    return this.enqueue(
      async () => {
        const nativeBalance = await this.clientService.readClient!.getBalance({
          address: this.address,
        });
        const expectedBalance = parseEther("0.0001");
        const nativeBalanceToRequest =
          nativeBalance > expectedBalance
            ? undefined
            : formatEther(expectedBalance - nativeBalance);
        return this.faucetRpc.obtainTestTokens(
          new FaucetRequestDto(
            this.token,
            this.address,
            amount,
            nativeBalanceToRequest,
          ),
        );
      },
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
