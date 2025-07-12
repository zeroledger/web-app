import { Address, zeroAddress } from "viem";
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
  decrypt,
} from "@src/utils/vault";
import {
  LedgerRecordDto,
  CommitmentsService,
  CommitmentsHistoryService,
} from "@src/services/ledger";
import { delay, logStringify } from "@src/utils/common";

type VaultEventsHandler = {
  onCommitmentCreated?: (event: VaultEvent) => void;
  onCommitmentRemoved?: (event: VaultEvent) => void;
  onWithdrawal?: (event: VaultEvent) => void;
  onTokenDeposited?: (event: VaultEvent) => void;
  onTransactionSpent?: (event: VaultEvent) => void;
};

export class WalletService {
  private readonly address: Address;
  private faucetRpc: ServiceClient<FaucetRpc>;
  private logger = new Logger("WalletService");
  constructor(
    private readonly client: CustomClient,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly faucetUrl: string,
    private readonly faucetRpcClient: JsonRpcClient<FaucetRpc>,
    private readonly queue: MemoryQueue,
    private readonly commitmentsService: CommitmentsService,
    private readonly commitmentsHistoryService: CommitmentsHistoryService,
  ) {
    this.address = this.client.account.address;
    this.faucetRpc = this.faucetRpcClient.getService(this.faucetUrl, {
      namespace: "faucet",
    });
  }

  private async enqueue<T>(fn: () => Promise<T>) {
    const [err, result] = await this.queue.schedule("walletService", fn);
    if (err) {
      throw err;
    }
    return result;
  }

  async getBalance() {
    const commitments = await this.commitmentsService.all();
    return commitments.reduce((acc, c) => acc + BigInt(c.value), 0n);
  }

  deposit(value: bigint) {
    return this.enqueue(async () => {
      const { proofData, depositStruct, depositCommitmentData } =
        await prepareDeposit(this.token, this.client, value);

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

      await this.commitmentsService.saveMany(
        depositStruct.depositCommitmentParams.map((param, index) =>
          LedgerRecordDto.from(
            param.poseidonHash,
            depositCommitmentData.amounts[index],
            depositCommitmentData.sValues[index],
          ),
        ),
      );

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

      const { proofData, transactionStruct } = await prepareSpend(
        selectedCommitmentRecords,
        this.token,
        totalAmount,
        0n,
        value,
        this.address,
        this.address,
        publicOutputs,
      );

      await spend({
        transactionStruct,
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      await this.commitmentsService.deleteMany(
        proofData.proofInput.inputs_hashes.map((hash) => hash.toString()),
      );

      const newRecords = transactionStruct.outputsOwners.flatMap((owner) => {
        if (owner.owner === this.address) {
          return owner.indexes.map((index) => {
            const hash = proofData.proofInput.outputs_hashes[index];
            const amount = proofData.proofInput.output_amounts[index];
            const sValue = proofData.proofInput.output_sValues[index];
            return LedgerRecordDto.from(hash, amount, sValue);
          });
        }
        return [];
      });

      await this.commitmentsService.saveMany(newRecords);

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

      await this.commitmentsService.deleteMany(withdrawItemIds);

      return true;
    });
  }

  send(value: bigint, recipient: Address) {
    return this.enqueue(async () => {
      const isRegistered = await isUserRegistered(
        this.address,
        this.vault,
        this.client,
      );
      if (!isRegistered) {
        this.logger.error("Sender PEPK is not registered");
        // throw new Error("User is not registered");
      }

      const isRecipientRegistered = await isUserRegistered(
        recipient,
        this.vault,
        this.client,
      );

      if (!isRecipientRegistered) {
        this.logger.error("Recipient PEPK is not registered");
        // throw new Error("User is not registered");
      }

      const publicOutputs = [{ owner: zeroAddress, amount: 0n }];

      const { selectedCommitmentRecords, totalAmount } =
        await this.commitmentsService.findCommitments(value);

      if (selectedCommitmentRecords.length === 0) {
        throw new Error("No commitments found to cover the requested amount");
      }

      const { proofData, transactionStruct } = await prepareSpend(
        selectedCommitmentRecords,
        this.token,
        totalAmount,
        value,
        0n,
        this.address,
        recipient,
        publicOutputs,
      );

      await spend({
        transactionStruct,
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      await this.commitmentsService.deleteMany(
        proofData.proofInput.inputs_hashes.map((hash) => hash.toString()),
      );

      const newRecords = transactionStruct.outputsOwners.flatMap((owner) => {
        if (owner.owner === this.address) {
          return owner.indexes.map((index) => {
            const hash = proofData.proofInput.outputs_hashes[index];
            const amount = proofData.proofInput.output_amounts[index];
            const sValue = proofData.proofInput.output_sValues[index];
            return LedgerRecordDto.from(hash, amount, sValue);
          });
        }
        return [];
      });

      await this.commitmentsService.saveMany(newRecords);

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

  subscribeOnVaultEvents(
    handler: VaultEventsHandler,
    onError: (error: Error) => void,
  ) {
    const handlerWrapper = async (events: VaultEvent[]) => {
      try {
        await this.enqueue(async () => {
          // artificially slow down event processing to increase stability of rpc interactions
          // @todo remove when migrate to fallback rpc logic
          await delay(500);
          await this.handleIncomingEvents(events, handler);
        });
      } catch (error) {
        onError(error as Error);
      }
    };
    watchVault(this.client, this.vault, handlerWrapper);
  }

  private async handleIncomingEvents(
    events: VaultEvent[],
    handler: VaultEventsHandler,
  ) {
    await Promise.all(
      events.map(async (event: VaultEvent) => {
        if (
          event.eventName === "CommitmentCreated" &&
          event.args.owner === this.address &&
          event.args.encryptedData &&
          !(await this.commitmentsService.findOne(
            event.args.poseidonHash!.toString(),
          ))
        ) {
          // add commitment to LedgerRecordDto
          const commitment = decrypt(event.args.encryptedData);
          this.logger.log(`commitment: ${logStringify(commitment)}`);
          await this.commitmentsService.save(
            LedgerRecordDto.from(
              event.args.poseidonHash!,
              commitment.amount,
              commitment.sValue,
            ),
          );
          handler.onCommitmentCreated?.(event);
          return;
        }
        if (
          event.eventName === "CommitmentRemoved" &&
          event.args.owner === this.address &&
          (await this.commitmentsService.findOne(
            event.args.poseidonHash!.toString(),
          ))
        ) {
          // remove commitment from LedgerRecordDto
          await this.commitmentsService.delete(
            event.args.poseidonHash!.toString(),
          );
          handler.onCommitmentRemoved?.(event);
          return;
        }
      }),
    );
  }
}
