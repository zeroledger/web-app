import { Address, formatEther, parseEther } from "viem";
import { FaucetRpc, FaucetRequestDto } from "@src/services/core/faucet.dto";
import { approve, allowance, permitSupported, permit } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "@src/services/core/rpc";
import { Logger } from "@src/utils/logger";
import type { MemoryQueue } from "@src/services/core/queue";
import {
  type CommitmentStruct,
  type DepositParams,
  type DepositParamsWithPermit,
} from "@src/utils/vault/types";
import {
  type SignedMetaTransaction,
  type UnsignedMetaTransaction,
} from "@src/utils/metatx";
import { catchService } from "@src/services/core/catch.service";
import { type Tes } from "@src/services/Tes";
import type Commitments from "./Commitments";
import type { EvmClients } from "@src/services/Clients";
import type { SpendFeesData, WithdrawFeesData, DepositFeesData } from "./Fees";

export type TransactionDetails = {
  type: "deposit" | "partialWithdraw" | "withdraw" | "send";
  vaultContract: Address;
  token: Address;
  from: Address;
  to: Address;
  value: bigint;
  forwarder: Address;
  inputs: bigint[];
  outputs: bigint[];
};

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [
    asyncVaultUtils,
    asyncMetaTxUtils,
    { Tes },
    asyncProtocolManagerUtils,
  ] = await Promise.all([
    import("@src/utils/vault"),
    import("@src/utils/metatx"),
    import("@src/services/Tes"),
    import("@src/utils/protocolManager"),
  ]);

  return {
    asyncVaultUtils,
    asyncMetaTxUtils,
    Tes,
    asyncProtocolManagerUtils,
  };
};

export class Transactions {
  private faucetRpc: ServiceClient<FaucetRpc>;
  private logger = new Logger(Transactions.name);
  private catchService = catchService;
  private preloadedModulesPromise: Promise<{
    asyncVaultUtils: typeof import("@src/utils/vault");
    asyncMetaTxUtils: typeof import("@src/utils/metatx");
    Tes: typeof import("@src/services/Tes").Tes;
    asyncProtocolManagerUtils: typeof import("@src/utils/protocolManager");
  }>;
  constructor(
    private readonly evmClients: EvmClients,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly faucetUrl: string,
    private readonly faucetRpcClient: JsonRpcClient<FaucetRpc>,
    private readonly queue: MemoryQueue,
    private readonly commitments: Commitments,
    private readonly tesService: Tes,
  ) {
    this.preloadedModulesPromise = loadHeavyDependencies();
    this.faucetRpc = this.faucetRpcClient.getService(this.faucetUrl, {
      namespace: "faucet",
    });
    this.logger.log(`Transactions service created with token ${this.token}`);
  }

  async mainAccount() {
    return (await this.evmClients.externalClient()).account;
  }

  async getForwarder() {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    return await asyncVaultUtils.getTrustedForwarder({
      client: this.evmClients.readClient,
      contract: this.vault,
    });
  }

  private async enqueue<T>(
    fn: () => Promise<T>,
    correlationId?: string,
    timeout?: number,
    forwardError?: boolean,
  ) {
    const [err, result] = await this.queue.schedule(
      Transactions.name,
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

  private async getEncryptionParams(user: Address) {
    const mainAccount = await this.mainAccount();
    const encryptionPublicKey = await this.tesService.getUserPublicKey(user);
    if (!encryptionPublicKey) {
      this.logger.warn(
        `${user} view account public key is not registered, getting trusted encryption token`,
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

  prepareDepositParamsForApproval(value: bigint, feesData: DepositFeesData) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils } = await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          mainAccount.address,
        );

        const { proofData, depositStruct /* depositCommitmentData */ } =
          await asyncVaultUtils.prepareDeposit(
            this.token,
            mainAccount.address,
            value,
            encryptionPublicKey,
            feesData.depositFee,
            feesData.fee,
            feesData.paymasterAddress,
            tesUrl,
          );

        const client = await this.evmClients.externalClient();

        const spendAllowance = await allowance({
          client,
          tokenAddress: this.token,
          ownerAddress: mainAccount.address,
          spenderAddress: this.vault,
        });

        return {
          depositStruct,
          client,
          contract: this.vault,
          proof: proofData.calldata_proof,
          approveRequired: spendAllowance < value,
          permitSupported: await permitSupported(this.token, client),
        };
      },
      "prepareDepositParamsForApproval",
      240_000,
      true,
    );
  }

  approveDeposit(depositParams: DepositParams, protocolFees: bigint) {
    return this.enqueue(
      async () => {
        await approve({
          tokenAddress: depositParams.depositStruct.token,
          receiverAddress: this.vault,
          amount:
            depositParams.depositStruct.amount +
            depositParams.depositStruct.forwarderFee +
            protocolFees,
          client: await this.evmClients.externalClient(),
        });
      },
      "approveDeposit",
      80_000,
      true,
    );
  }

  permitDeposit(depositParams: DepositParams, protocolFees: bigint) {
    return this.enqueue(
      async () => {
        return await permit({
          tokenAddress: depositParams.depositStruct.token,
          receiverAddress: this.vault,
          amount:
            depositParams.depositStruct.amount +
            depositParams.depositStruct.forwarderFee +
            protocolFees,
          client: await this.evmClients.externalClient(),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        });
      },
      "permitDeposit",
      80_000,
      true,
    );
  }

  signMetaTransaction(metaTransaction: UnsignedMetaTransaction) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await this.preloadedModulesPromise;
        return await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          await this.getForwarder(),
          await this.evmClients.externalClient(),
        );
      },
      "signMetaTransaction",
      30_000,
      true,
    );
  }

  executeMetaTransactions(
    metaTransactions: SignedMetaTransaction[],
    coveredGas: string,
  ) {
    return this.enqueue(
      async () => {
        const mainAccount = await this.mainAccount();
        return await this.tesService.executeMetaTransactions(
          metaTransactions,
          coveredGas,
          mainAccount.address,
        );
      },
      "executeMetaTransaction",
      50_000,
      true,
    );
  }

  signAndExecuteMetaTransaction(
    metaTransaction: UnsignedMetaTransaction,
    coveredGas: string,
  ) {
    return this.enqueue(
      async () => {
        const { asyncMetaTxUtils } = await this.preloadedModulesPromise;
        const signedMetaTransaction = await asyncMetaTxUtils.createSignedMetaTx(
          metaTransaction,
          await this.getForwarder(),
          await this.evmClients.externalClient(),
        );
        const mainAccount = await this.mainAccount();
        return await this.tesService.executeMetaTransactions(
          [signedMetaTransaction],
          coveredGas,
          mainAccount.address,
        );
      },
      "signAndExecuteMetaTransaction",
      80_000,
      true,
    );
  }

  prepareDepositMetaTransaction(depositParams: DepositParams) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const gas = await asyncVaultUtils.getDepositTxGas(depositParams);

        this.logger.log(`Deposit: gas without forwarding: ${gas.toString()}`);

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0n,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              await this.getForwarder(),
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getDepositTxData(
              depositParams.depositStruct,
              depositParams.proof,
            ),
          } as UnsignedMetaTransaction,
          transactionDetails: {
            type: "deposit",
            vaultContract: this.vault,
            token: this.token,
            from: mainAccount.address,
            to: mainAccount.address,
            value: depositParams.depositStruct.amount,
            forwarder: await this.getForwarder(),
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

  prepareDepositMetaTransactionWithPermit(
    depositParams: DepositParamsWithPermit,
  ) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();
        const gas =
          await asyncVaultUtils.getDepositWithPermitTxGas(depositParams);

        this.logger.log(`Deposit: gas without forwarding: ${gas.toString()}`);

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0n,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              await this.getForwarder(),
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getDepositWithPermitTxData(
              depositParams.depositStruct,
              depositParams.proof,
              depositParams.permitSignature,
              depositParams.deadline,
            ),
          } as UnsignedMetaTransaction,
          transactionDetails: {
            type: "deposit",
            vaultContract: this.vault,
            token: this.token,
            from: mainAccount.address,
            to: mainAccount.address,
            value: depositParams.depositStruct.amount,
            forwarder: await this.getForwarder(),
            inputs: [],
            outputs: await Promise.all(
              depositParams.depositStruct.depositCommitmentParams.map(
                (item) => item.poseidonHash,
              ),
            ),
          } as TransactionDetails,
        };
      },
      "prepareDepositMetaTransactionWithPermit",
      240_000,
      true,
    );
  }

  async getWithdrawAllItems() {
    const commitments = await this.commitments.all();

    const withdrawItems: CommitmentStruct[] = [];
    commitments.forEach((c) => {
      if (BigInt(c.value) === 0n) {
        return;
      }
      withdrawItems.push({
        amount: BigInt(c.value),
        sValue: BigInt(c.sValue),
      });
    });

    return withdrawItems;
  }

  prepareWithdrawMetaTransaction(
    recipient: Address,
    feesData: WithdrawFeesData,
    withdrawItems: CommitmentStruct[],
  ) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();

        if (withdrawItems.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const withdrawAmount = withdrawItems.reduce(
          (acc, item) => acc + item.amount,
          0n,
        );

        const withdrawParams = {
          client: await this.evmClients.externalClient(),
          contract: this.vault,
          token: this.token,
          withdrawItems,
          withdrawRecipients: [
            { recipient: feesData.paymasterAddress, amount: feesData.fee },
            {
              recipient,
              amount: withdrawAmount - feesData.fee - feesData.withdrawFee,
            },
          ],
        };

        const gas = await asyncVaultUtils.getWithdrawTxGas(withdrawParams);

        this.logger.log(
          `Withdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${feesData.coveredGas.toString()}`,
        );

        const { computePoseidon } = await import("@src/utils/poseidon");

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0n,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              await this.getForwarder(),
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getWithdrawTxData(withdrawParams),
          } as UnsignedMetaTransaction,
          transactionDetails: {
            token: withdrawParams.token,
            type: "withdraw",
            vaultContract: withdrawParams.contract,
            from: mainAccount.address,
            to: recipient,
            value: withdrawAmount - feesData.fee - feesData.withdrawFee,
            forwarder: await this.getForwarder(),
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

  preparePartialWithdrawMetaTransaction(
    value: bigint,
    recipient: Address,
    feesData: SpendFeesData,
  ) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();

        const { selectedCommitmentRecords, totalAmount } =
          await this.commitments.findCommitments(value);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        this.logger.log(
          `PartialWithdraw: selectedCommitmentRecords: ${selectedCommitmentRecords.length}, totalAmount: ${totalAmount}`,
        );

        const publicOutputs = [
          {
            owner: recipient,
            amount: value - feesData.fee - feesData.spendFee,
          },
          {
            owner: feesData.paymasterAddress,
            amount: feesData.fee,
          },
        ];

        const { encryptionPublicKey, tesUrl } = await this.getEncryptionParams(
          mainAccount.address,
        );

        const { proofData, transactionStruct } =
          await asyncVaultUtils.prepareSpend({
            token: this.token,
            commitments: selectedCommitmentRecords,
            movingAmount: totalAmount,
            protocolFee: feesData.spendFee,
            spender: mainAccount.address,
            spenderEncryptionPublicKey: encryptionPublicKey,
            spenderTesUrl: tesUrl,
            receiver: mainAccount.address,
            receiverEncryptionPublicKey: encryptionPublicKey,
            receiverTesUrl: tesUrl,
            privateSpend: 0n,
            publicOutputs,
            decoyParams: null,
          });

        const partialWithdrawParams = {
          transactionStruct,
          client: await this.evmClients.externalClient(),
          contract: this.vault,
          proof: proofData.calldata_proof,
        };

        const gas = await asyncVaultUtils.getSpendTxGas(partialWithdrawParams);

        this.logger.log(
          `PartialWithdraw: gas without forwarding: ${gas.toString()}, coveredGas: ${feesData.coveredGas.toString()}`,
        );

        return {
          metaTransaction: {
            from: mainAccount.address,
            to: this.vault,
            value: 0n,
            gas,
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              await this.getForwarder(),
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600,
            data: asyncVaultUtils.getSpendTxData(
              transactionStruct,
              proofData.calldata_proof,
            ),
          } as UnsignedMetaTransaction,
          transactionDetails: {
            type: "partialWithdraw",
            vaultContract: this.vault,
            token: this.token,
            from: mainAccount.address,
            to: recipient,
            value: value - feesData.fee - feesData.spendFee,
            forwarder: await this.getForwarder(),
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

  prepareSendMetaTransaction(
    value: bigint,
    recipient: Address,
    consolidation: boolean,
    feesData: SpendFeesData,
  ) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncMetaTxUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = await this.mainAccount();

        /**
         * Inputs rebate fee, outputs add fee
         * That means 1 - 3 is the most expensive gas to cover
         */
        const { selectedCommitmentRecords, totalAmount } =
          await this.commitments.findCommitments(value, consolidation ? 16 : 3);

        if (selectedCommitmentRecords.length === 0) {
          throw new Error("No commitments found to cover the requested amount");
        }

        const publicOutputs = [
          {
            owner: feesData.paymasterAddress,
            amount: feesData.fee,
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

        const decoyParams = await this.tesService.getDecoyRecipient();

        this.logger.log(`decoyParams: ${JSON.stringify(decoyParams)}`);

        const privateSpend = value - feesData.fee - feesData.spendFee;

        const { proofData, transactionStruct } =
          await asyncVaultUtils.prepareSpend({
            commitments: selectedCommitmentRecords,
            token: this.token,
            movingAmount: totalAmount,
            protocolFee: feesData.spendFee,
            spender: mainAccount.address,
            spenderEncryptionPublicKey,
            spenderTesUrl,
            receiver: recipient,
            receiverEncryptionPublicKey,
            receiverTesUrl,
            privateSpend,
            publicOutputs,
            decoyParams:
              consolidation ||
              decoyParams?.address === mainAccount.address ||
              decoyParams?.address === recipient
                ? null
                : decoyParams,
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
            value: 0n,
            gas: await asyncVaultUtils.getSpendTxGas(sendParams),
            nonce: await asyncMetaTxUtils.getForwarderNonce(
              mainAccount.address,
              await this.getForwarder(),
              this.evmClients.readClient,
            ),
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            data: asyncVaultUtils.getSpendTxData(
              transactionStruct,
              proofData.calldata_proof,
            ),
          } as UnsignedMetaTransaction,
          transactionDetails: {
            type: "send",
            vaultContract: this.vault,
            token: this.token,
            from: mainAccount.address,
            to: recipient,
            value: value - feesData.fee - feesData.spendFee,
            forwarder: await this.getForwarder(),
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

  async faucet(amount: string) {
    return this.enqueue(
      async () => {
        const mainAccount = await this.mainAccount();
        return this.faucetRpc.obtainTestTokens(
          new FaucetRequestDto(
            this.token,
            mainAccount.address,
            amount,
            // await this.getNativeBalanceToRequest(mainAccount.address),
          ),
        );
      },
      "faucet",
      240_000,
    );
  }

  private async getNativeBalanceToRequest(account: Address) {
    const userBalance = await this.evmClients.readClient.getBalance({
      address: account,
    });
    console.log("userBalance", userBalance.toString());
    const expectedBalance = parseEther("0.0001");
    const nativeBalanceToFill =
      userBalance > expectedBalance ? 0n : expectedBalance - userBalance;
    const result =
      nativeBalanceToFill < userBalance
        ? undefined
        : formatEther(nativeBalanceToFill);
    console.log("result", result);
    return result;
  }
}
