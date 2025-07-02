import { Address } from "viem";
import { FaucetRpc, FaucetRequestDto } from "../client/client.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "../rpc";
import { CustomClient } from "@src/common.types";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "../queue";
import { prepareDeposit, deposit } from "@src/utils/vault";
import { DecoyRecordDto, DecoyRecordsEntity } from "./records.entity";

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
    console.log(records);
    return records.reduce((acc, record) => acc + BigInt(record.value), 0n);
  }

  deposit(value: bigint) {
    return this.enqueue(async () => {
      this.logger.log("deposit");
      const { proofData, depositStruct, commitmentData } = await prepareDeposit(
        this.token,
        this.client,
        value,
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

      await this.records.saveMany(
        depositStruct.depositCommitmentParams.map(
          (param, index) =>
            new DecoyRecordDto(
              param.poseidonHash,
              commitmentData.amounts[index],
              commitmentData.sValues[index],
            ),
        ),
      );

      return true;
    });
  }

  send() {}

  async faucet(amount: string) {
    return this.enqueue(() =>
      this.faucetRpc.obtainTestTokens(
        new FaucetRequestDto(this.token, this.address, amount, "0.0001"),
      ),
    );
  }
}
