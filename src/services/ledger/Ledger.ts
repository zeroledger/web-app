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
import { type Tes } from "@src/services/Tes";
import type Commitments from "./Commitments";
import CommitmentsHistory from "./CommitmentsHistory";
import SyncService from "./SyncService";
import { HistoryRecordDto, LedgerRecordDto } from "./ledger.dto";
import { EvmClients } from "@src/services/Clients";
import { ViewAccount } from "@src/services/Account";
import { compareEvents, EventLike } from "@src/utils/events";
import { AxiosInstance } from "axios";
import { computePoseidon } from "@src/utils/poseidon";
import { LedgerEvents } from "./events";

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
  const [asyncVaultUtils, asyncMetaTxUtils, { Tes }] = await Promise.all([
    import("@src/utils/vault"),
    import("@src/utils/metatx"),
    import("@src/services/Tes"),
  ]);

  return {
    asyncVaultUtils,
    asyncMetaTxUtils,
    Tes,
  };
};

// Cache for preloaded modules
const preloadedModulesPromise = loadHeavyDependencies();

export class Ledger extends EventEmitter {
  private faucetRpc: ServiceClient<FaucetRpc>;
  private logger = new Logger(Ledger.name);
  private catchService = catchService;
  private eventsCache: VaultEvent[] = [];
  private eventsHandlerDebounced: ReturnType<typeof debounce>;
  private updateBothBalancesDebounced: ReturnType<typeof debounce>;

  constructor(
    private readonly viewAccount: ViewAccount,
    private readonly evmClients: EvmClients,
    private readonly vault: Address,
    private readonly forwarder: Address,
    private readonly token: Address,
    private readonly faucetUrl: string,
    private readonly faucetRpcClient: JsonRpcClient<FaucetRpc>,
    private readonly queue: MemoryQueue,
    private readonly commitments: Commitments,
    private readonly commitmentsHistory: CommitmentsHistory,
    private readonly syncService: SyncService,
    private readonly tesService: Tes,
    private readonly axios: AxiosInstance,
  ) {
    super();
    this.faucetRpc = this.faucetRpcClient.getService(this.faucetUrl, {
      namespace: "faucet",
    });
    this.updateBothBalancesDebounced = debounce(
      () => this.updateBothBalances(),
      1000,
    );
    this.eventsHandlerDebounced = debounce(
      () =>
        this.enqueue(
          () => this.handleEventsBatch({ updateBlockNumber: true }),
          "handleEventsBatch",
          80_000,
        ),
      1000,
    );
    this.logger.log(`LedgerService created with token ${this.token}`);
  }

  async mainAccount() {
    return (await this.evmClients.externalClient()).account;
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
      Ledger.name,
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
    this.safeEmit(LedgerEvents.PRIVATE_BALANCE_CHANGE, await this.getBalance());
    this.safeEmit(LedgerEvents.ONCHAIN_BALANCE_CHANGE);
  }

  private async getEncryptionParams(user: Address) {
    const mainAccount = await this.mainAccount();
    const { asyncVaultUtils } = await preloadedModulesPromise;
    const { publicKey: encryptionPublicKey, active: senderActive } =
      await asyncVaultUtils.isUserRegistered(
        user,
        this.vault,
        this.evmClients.readClient,
      );
    if (!senderActive) {
      this.logger.warn(
        `${user} PEPK is not registered, getting trusted encryption token`,
      );
      return {
        encryptionPublicKey: await this.tesService.getTrustedEncryptionToken(
          mainAccount.address,
        ),
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
    const mainAccount = await this.mainAccount();
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
        const { encryptedCommitment, tesUrl } = decodeMetadata(
          event.args.metadata,
        );

        let commitment: CommitmentStruct;

        if (tesUrl.length && tesUrl === this.tesService.tesUrl) {
          commitment = await this.tesService.decrypt(
            event.blockNumber!.toString(),
            this.token,
            event.args.poseidonHash!.toString(),
            mainAccount.address,
          );
        } else if (tesUrl.length && tesUrl !== this.tesService.tesUrl) {
          const dynamicModules = await preloadedModulesPromise;
          const shortLivedTes = new dynamicModules.Tes(
            tesUrl,
            this.viewAccount,
            this.queue,
            this.axios,
          );
          commitment = await shortLivedTes.decrypt(
            event.blockNumber!.toString(),
            this.token,
            event.args.poseidonHash!.toString(),
            mainAccount.address,
          );
        } else {
          this.logger.log(
            `local decryption of encryptedCommitment: ${encryptedCommitment}`,
          );
          commitment = decryptCommitment(
            encryptedCommitment,
            this.viewAccount.viewPrivateKey()!,
          );
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
      const transactions = await this.commitmentsHistory.all();

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

  async start() {
    // enqueue prevents handleIncomingEventsDebounced to be activated before sync is done,
    // so that old commitments processed before 'real-time' incoming
    await this.enqueue(
      async () => {
        watchVault(this.evmClients.readClient, this.vault, (events) => {
          this.eventsCache.push(...events);
          this.eventsHandlerDebounced();
        });
        const currentBlock = await this.evmClients.readClient.getBlockNumber();
        const mainAccount = await this.mainAccount();
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

  prepareDepositParamsForApproval(value: bigint) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils } = await preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          mainAccount.address,
        );

        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
          mainAccount.address,
        );

        const gasToCover = asyncVaultUtils.depositGasSponsoredLimit();
        const fee = gasToCover * gasPrice;

        const { proofData, depositStruct /* depositCommitmentData */ } =
          await asyncVaultUtils.prepareDeposit(
            this.token,
            mainAccount.address,
            value - fee,
            encryptionPublicKey,
            fee,
            paymasterAddress,
            tesUrl,
          );

        const depositParams = {
          depositStruct,
          client: await this.evmClients.externalClient(),
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        return {
          depositParams,
          gasToCover,
        };
      },
      "prepareDepositParamsForApproval",
      240_000,
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
          client: await this.evmClients.externalClient(),
        });
      },
      "approveDeposit",
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
        const mainAccount = await this.mainAccount();
        const gas = await asyncVaultUtils.getDepositTxGas(depositParams);

        this.logger.log(
          `Deposit: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              this.forwarder,
              this.evmClients.readClient,
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
            from: mainAccount.address,
            to: mainAccount.address,
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
      "prepareDepositMetaTransaction",
      240_000,
      true,
    );
  }

  deposit(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const mainAccount = await this.mainAccount();
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          await this.evmClients.externalClient(),
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
          mainAccount.address,
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
        const mainAccount = await this.mainAccount();
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
          mainAccount.address,
        );

        const gasToCover = asyncVaultUtils.spendGasSponsoredLimit(1, 3, 2);
        const fee = gasPrice * gasToCover;

        const { selectedCommitmentRecords, totalAmount: totalMovingAmount } =
          await this.commitments.findCommitments(value);

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
          mainAccount.address,
        );

        const { proofData, transactionStruct } =
          await asyncVaultUtils.prepareSpend({
            commitments: selectedCommitmentRecords,
            token: this.token,
            totalMovingAmount,
            privateSpendAmount: 0n,
            publicSpendAmount: value,
            spender: mainAccount.address,
            spenderEncryptionPublicKey: encryptionPublicKey,
            spenderTesUrl: tesUrl,
            receiver: mainAccount.address,
            receiverEncryptionPublicKey: encryptionPublicKey,
            receiverTesUrl: tesUrl,
            publicOutputs,
          });

        const partialWithdrawParams = {
          transactionStruct,
          client: await this.evmClients.externalClient(),
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        const gas = await asyncVaultUtils.getSpendTxGas(partialWithdrawParams);

        this.logger.log(
          `PartialWithdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${gasToCover.toString()}`,
        );

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              this.forwarder,
              this.evmClients.readClient,
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
            from: mainAccount.address,
            to: recipient,
            value: value - fee,
            fee: fee,
            paymaster: paymasterAddress,
            inputs: transactionStruct.inputsPoseidonHashes,
            outputs: transactionStruct.outputsPoseidonHashes,
          } as TransactionDetails,
        };
      },
      "preparePartialWithdrawMetaTransaction",
      240_000,
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
        const mainAccount = await this.mainAccount();
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          await this.evmClients.externalClient(),
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
          mainAccount.address,
        );
      },
      "partialWithdraw",
      80_000,
      true,
    );
  }

  prepareWithdrawMetaTransaction(recipient: Address) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const commitments = await this.commitments.all();

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
          mainAccount.address,
        );

        const withdrawParams = {
          client: await this.evmClients.externalClient(),
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
            from: mainAccount.address,
            to: this.vault,
            value: 0,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              this.forwarder,
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getWithdrawTxData(withdrawParams),
          } as UnsignedMetaTransaction,
          coveredGas: gasToCover.toString(),
          transactionDetails: {
            type: "withdraw",
            vaultContract: withdrawParams.contract,
            from: mainAccount.address,
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
      "prepareWithdrawMetaTransaction",
      240_000,
      true,
    );
  }

  withdraw(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          await this.evmClients.externalClient(),
        );
        return await this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
          mainAccount.address,
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
        const mainAccount = await this.mainAccount();
        const { gasPrice, paymasterAddress } = await this.tesService.quote(
          this.token,
          mainAccount.address,
        );

        const gasToCover = asyncVaultUtils.spendGasSponsoredLimit(1, 3, 1);
        const fee = gasPrice * gasToCover;
        const { selectedCommitmentRecords, totalAmount } =
          await this.commitments.findCommitments(value - fee);

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
        } = await this.getEncryptionParams(mainAccount.address);

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
            spender: mainAccount.address,
            spenderEncryptionPublicKey,
            spenderTesUrl,
            receiver: recipient,
            receiverEncryptionPublicKey,
            receiverTesUrl,
            publicOutputs,
          });

        const sendParams = {
          transactionStruct,
          client: await this.evmClients.externalClient(),
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0,
            gas: await asyncVaultUtils.getSpendTxGas(sendParams),
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              this.forwarder,
              this.evmClients.readClient,
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
            from: mainAccount.address,
            to: recipient,
            value: value - fee,
            fee: fee,
            paymaster: paymasterAddress,
            inputs: transactionStruct.inputsPoseidonHashes,
            outputs: transactionStruct.outputsPoseidonHashes,
          } as TransactionDetails,
        };
      },
      "prepareSendMetaTransaction",
      240_000,
      true,
    );
  }

  send(metaTransaction: UnsignedMetaTransaction, coveredGas: string) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          this.forwarder,
          await this.evmClients.externalClient(),
        );
        return this.tesService.executeMetaTransaction(
          signedMetaTransaction,
          coveredGas,
          mainAccount.address,
        );
      },
      "send",
      80_000,
      true,
    );
  }

  async faucet(amount: string) {
    return this.enqueue(
      async () => {
        const mainAccount = await this.mainAccount();
        const userBalance = await this.evmClients.readClient.getBalance({
          address: mainAccount.address,
        });
        const expectedBalance = parseEther("0.0001");
        const nativeBalanceToFill =
          userBalance > expectedBalance ? 0n : expectedBalance - userBalance;
        const nativeBalanceToRequest =
          nativeBalanceToFill < userBalance
            ? undefined
            : formatEther(nativeBalanceToFill);
        return this.faucetRpc.obtainTestTokens(
          new FaucetRequestDto(
            this.token,
            mainAccount.address,
            amount,
            nativeBalanceToRequest,
          ),
        );
      },
      "faucet",
      240_000,
    );
  }

  softReset() {
    return this.enqueue(async () => {
      this.updateBothBalancesDebounced.clear();
      this.eventsHandlerDebounced.clear();
      this.eventsCache = [];
      this.tesService.reset();
    });
  }

  async reset() {
    await this.softReset();
    this.commitments.reset();
    this.commitmentsHistory.reset();
    this.syncService.reset();
  }
}
