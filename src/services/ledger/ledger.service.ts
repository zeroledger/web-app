import { Address, formatEther, parseEther } from "viem";
import { EventEmitter } from "node:events";
import debounce from "debounce";
import { FaucetRpc, FaucetRequestDto } from "@src/services/core/faucet.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "@src/services/core/rpc";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "@src/services/core/queue";
import {
  type CommitmentStruct,
  type VaultEvent,
  type VaultCommitmentCreatedEvent,
  type VaultCommitmentRemovedEvent,
  type DepositParams,
} from "@src/utils/vault/types";
import { decodeMetadata, decryptCommitment } from "@src/utils/vault/metadata";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { watchVault } from "@src/utils/vault/watcher";
import { catchService } from "@src/services/core/catch.service";
import { type TesService } from "@src/services/tes.service";
import type CommitmentsService from "./commitments.service";
import CommitmentsHistoryService from "./history.service";
import SyncService from "./sync.service";
import { HistoryRecordDto, LedgerRecordDto } from "./ledger.dto";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { ViewAccountService } from "@src/services/viewAccount.service";
import { compareEvents, EventLike } from "@src/utils/events";
import { logStringify } from "@src/utils/common";
import { AxiosInstance } from "axios";
import { computePoseidon } from "@src/utils/poseidon";
import { LedgerServiceEvents } from "./events";

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

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [asyncVaultUtils, asyncMetaTxUtils, { TesService }] = await Promise.all(
    [
      import("@src/utils/vault"),
      import("@src/utils/metatx"),
      import("@src/services/tes.service"),
    ],
  );

  return {
    asyncVaultUtils,
    asyncMetaTxUtils,
    TesService,
  };
};

// Cache for preloaded modules
const preloadedModulesPromise = loadHeavyDependencies();

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
    this.updateBothBalancesDebounced = debounce(
      () => this.updateBothBalances(),
      1000,
      {
        immediate: true,
      },
    );
    this.eventsHandlerDebounced = debounce(
      () =>
        this.enqueue(
          () => this.handleEventsBatch({ updateBlockNumber: true }),
          "LedgerService.handleEventsBatch",
          80_000,
        ),
      1000,
    );
    this.logger.log(`LedgerService created with token ${this.token}`);
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
    this.logger.log("updating both balances");
    this.safeEmit(
      LedgerServiceEvents.PRIVATE_BALANCE_CHANGE,
      await this.getBalance(),
    );
    this.safeEmit(LedgerServiceEvents.ONCHAIN_BALANCE_CHANGE);
  }

  private async getEncryptionParams(user: Address) {
    const { asyncVaultUtils } = await preloadedModulesPromise;
    const { publicKey: encryptionPublicKey, active: senderActive } =
      await asyncVaultUtils.isUserRegistered(
        user,
        this.vault,
        this.clientService.readClient!,
      );
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

  private async handleEventsBatch({
    updateBlockNumber = false,
  }: { updateBlockNumber?: boolean } = {}) {
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
          const dynamicModules = await preloadedModulesPromise;
          const shortLivedTes = new dynamicModules.TesService(
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
        if (updateBlockNumber) {
          await this.syncService.setLastSyncedBlock(
            event.blockNumber!.toString(),
          );
        }
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
        if (updateBlockNumber) {
          await this.syncService.setLastSyncedBlock(
            event.blockNumber!.toString(),
          );
        }
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
    this.logger.log(`GetBalance: commitments amount - ${commitments.length}`);
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
        this.updateBothBalancesDebounced();
      },
      "LedgerService.start",
      240_000,
    );
  }

  prepareDepositParamsForApproval(value: bigint) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils } = await preloadedModulesPromise;
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          this.address,
        );

        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = asyncVaultUtils.depositGasSponsoredLimit();
        const fee = gasToCover * gasPrice;

        const { proofData, depositStruct /* depositCommitmentData */ } =
          await asyncVaultUtils.prepareDeposit(
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

        return {
          depositParams,
          gasToCover,
        };
      },
      "LedgerService.prepareDepositParamsForApproval",
      480_000,
      true,
    );
  }

  approveDeposit(depositParams: DepositParams) {
    return this.enqueue(
      async () => {
        await approve({
          tokenAddress: depositParams.depositStruct.token,
          receiverAddress: this.vault,
          amount:
            depositParams.depositStruct.total_deposit_amount +
            depositParams.depositStruct.fee,
          client: this.clientService.writeClient!,
        });
      },
      "LedgerService.approveDeposit",
      80_000,
      true,
    );
  }

  prepareDepositMetaTransaction(
    depositParams: DepositParams,
    gasToCover: bigint,
  ) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await preloadedModulesPromise;
        const gas = await asyncVaultUtils.getDepositTxGas(depositParams);

        this.logger.log(
          `Deposit: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getDepositTxData(
              depositParams.depositStruct,
              depositParams.proof,
            ),
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "deposit",
            vaultContract: this.vault,
            token: this.token,
            from: this.address,
            to: this.address,
            value: depositParams.depositStruct.total_deposit_amount,
            fee: depositParams.depositStruct.fee,
            paymaster: depositParams.depositStruct.feeRecipient,
            inputs: [],
            outputs: await Promise.all(
              depositParams.depositStruct.depositCommitmentParams.map(
                (item) => item.poseidonHash,
              ),
            ),
          } as TransactionDetails,
        };
      },
      "LedgerService.prepareDepositMetaTransaction",
      480_000,
      true,
    );
  }

  deposit(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
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
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await preloadedModulesPromise;
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = asyncVaultUtils.spendGasSponsoredLimit(1, 3, 2);
        const fee = gasPrice * gasToCover;

        const { selectedCommitmentRecords, totalAmount: totalMovingAmount } =
          await this.commitmentsService.findCommitments(value);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        this.logger.log(
          `PartialWithdraw: selectedCommitmentRecords: ${selectedCommitmentRecords.length}, totalAmount: ${totalMovingAmount}`,
        );

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

        const { proofData, transactionStruct } =
          await asyncVaultUtils.prepareSpend({
            commitments: selectedCommitmentRecords,
            token: this.token,
            totalMovingAmount,
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

        const partialWithdrawParams = {
          transactionStruct,
          client: this.clientService.writeClient!,
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        const gas = await asyncVaultUtils.getSpendTxGas(partialWithdrawParams);

        this.logger.log(
          `PartialWithdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600,
            data: asyncVaultUtils.getSpendTxData(
              transactionStruct,
              proofData.calldata_proof,
            ),
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
      true,
    );
  }

  partialWithdraw(
    metaTransaction: UnsignedMetaTransaction,
    coveredGas: string,
  ) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
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
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await preloadedModulesPromise;
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

        const gasToCover = asyncVaultUtils.withdrawGasSponsoredLimit(
          withdrawItems.length,
        );

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

        const gas = await asyncVaultUtils.getWithdrawTxGas(withdrawParams);

        this.logger.log(
          `Withdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
            from: this.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getWithdrawTxData(withdrawParams),
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
      true,
    );
  }

  withdraw(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
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
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await preloadedModulesPromise;
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
        );

        const gasToCover = asyncVaultUtils.spendGasSponsoredLimit(1, 3, 1);
        const fee = gasPrice * gasToCover;
        const { selectedCommitmentRecords, totalAmount } =
          await this.commitmentsService.findCommitments(value - fee);

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

        const { proofData, transactionStruct } =
          await asyncVaultUtils.prepareSpend({
            commitments: selectedCommitmentRecords,
            token: this.token,
            totalMovingAmount: totalAmount,
            privateSpendAmount: value - fee,
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
            gas: await asyncVaultUtils.getSpendTxGas(sendParams),
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              this.address,
              this.forwarder,
              this.clientService.readClient!,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getSpendTxData(
              transactionStruct,
              proofData.calldata_proof,
            ),
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "send",
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
      "LedgerService.prepareSendMetaTransaction",
      480_000,
      true,
    );
  }

  send(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
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

  async softReset() {
    this.updateBothBalancesDebounced.clear();
    this.eventsHandlerDebounced.clear();
    this.eventsCache = [];
  }

  async reset() {
    this.softReset();
    this.tesService.reset();
    this.commitmentsService.reset();
    this.commitmentsHistoryService.reset();
    this.syncService.reset();
  }
}
