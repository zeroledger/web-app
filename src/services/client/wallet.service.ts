import { Address, zeroAddress } from "viem";
import { FaucetRpc, FaucetRequestDto } from "../client/client.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "../rpc";
import { CustomClient } from "@src/common.types";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "../queue";
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
import { LedgerRecordDto, DecoyRecordsEntity } from "./records.entity";
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
    private readonly records: DecoyRecordsEntity,
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
    const records = await this.records.all();
    return records.reduce((acc, record) => acc + BigInt(record.value), 0n);
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

      await this.records.saveMany(
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

      const records = await this.records.all();
      this.logger.log(`records: ${JSON.stringify(records)}`);
      const { proofData, transactionStruct } = await prepareSpend(
        records,
        this.token,
        0n,
        this.address,
        this.address,
        [{ owner: recipient, amount: value }],
      );

      await spend({
        transactionStruct,
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      await this.records.deleteMany(
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

      await this.records.saveMany(newRecords);

      return true;
    });
  }

  withdraw(recipient: Address) {
    return this.enqueue(async () => {
      const records = await this.records.all();

      const withdrawItems: CommitmentStruct[] = [];
      const withdrawItemIds: string[] = [];
      records.forEach((record) => {
        if (BigInt(record.value) === 0n) {
          return;
        }
        withdrawItems.push({
          amount: BigInt(record.value),
          sValue: BigInt(record.sValue),
        });
        withdrawItemIds.push(record.hash);
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

      await this.records.deleteMany(withdrawItemIds);

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

      const records = await this.records.all();
      this.logger.log(`records: ${JSON.stringify(records)}`);
      const { proofData, transactionStruct } = await prepareSpend(
        records,
        this.token,
        value,
        this.address,
        recipient,
        [{ owner: zeroAddress, amount: 0n }],
      );

      await spend({
        transactionStruct,
        client: this.client,
        contract: this.vault,
        proof: proofData.calldata_proof,
      });

      await this.records.deleteMany(
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

      await this.records.saveMany(newRecords);

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
          !(await this.records.findOne(event.args.poseidonHash!.toString()))
        ) {
          // add commitment to LedgerRecordDto
          const commitment = decrypt(event.args.encryptedData);
          this.logger.log(`commitment: ${logStringify(commitment)}`);
          await this.records.save(
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
          (await this.records.findOne(event.args.poseidonHash!.toString()))
        ) {
          // remove commitment from LedgerRecordDto
          await this.records.delete(event.args.poseidonHash!.toString());
          handler.onCommitmentRemoved?.(event);
          return;
        }
        if (
          event.eventName === "Withdrawal" &&
          event.args.user === this.address
        ) {
          // add withdrawal to transaction history
          handler.onWithdrawal?.(event);
          return;
        }
        if (
          event.eventName === "TokenDeposited" &&
          event.args.user === this.address
        ) {
          // add deposit to transaction history
          handler.onTokenDeposited?.(event);
          return;
        }
        if (
          event.eventName === "TransactionSpent" &&
          event.args.owner === this.address
        ) {
          // add withdrawal to transaction history
          handler.onTransactionSpent?.(event);
          return;
        }
      }),
    );
  }
}
