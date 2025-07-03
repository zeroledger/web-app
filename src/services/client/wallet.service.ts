import { Address } from "viem";
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
} from "@src/utils/vault";
import { DecoyRecordDto, DecoyRecordsEntity } from "./records.entity";
import { withdrawBatch } from "@src/utils/extensions/withdraw";
import { WithdrawItem } from "@src/utils/extensions/withdraw/withdraw.extension";

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
          DecoyRecordDto.from(
            param.poseidonHash,
            depositCommitmentData.amounts[index],
            depositCommitmentData.sValues[index],
          ),
        ),
      );

      return true;
    });
  }

  withdraw() {
    return this.enqueue(async () => {
      const records = await this.records.all();

      const withdrawItems: WithdrawItem[] = [];
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
        return;
      }

      await withdrawBatch({
        client: this.client,
        contract: this.vault,
        token: this.token,
        withdrawItems,
      });

      await this.records.deleteMany(withdrawItemIds);

      return true;
    });
  }

  send(value: bigint, receiver: Address) {
    return this.enqueue(async () => {
      const isRegistered = await isUserRegistered(
        this.address,
        this.vault,
        this.client,
      );
      if (!isRegistered) {
        this.logger.error("User is not registered");
        // throw new Error("User is not registered");
      }

      const records = await this.records.all();
      this.logger.log(`records: ${JSON.stringify(records)}`);
      const { proofData, transactionStruct } = await prepareSpend(
        records,
        this.token,
        value,
        this.address,
        receiver,
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
            return DecoyRecordDto.from(hash, amount, sValue);
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
}
