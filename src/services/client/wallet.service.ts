import { Address, zeroAddress } from "viem";
import { FaucetRpc, FaucetRequestDto } from "../client/client.dto";
import { approve } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "../rpc";
import { CustomClient } from "@src/common.types";
import { Logger } from "@src/utils/logger";
import { MemoryQueue } from "../queue";
import { prepareDeposit, deposit } from "@src/utils/vault";

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
    return 0n;
  }

  deposit(value: bigint) {
    return this.enqueue(async () => {
      this.logger.log("deposit");
      const { proofData, depositStruct } = await prepareDeposit(
        this.token,
        this.client,
        value,
      );

      const transfer = {
        tokenAddress: depositStruct.token,
        receiverAddress: zeroAddress,
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
    });

    return true;
  }

  send() {}

  async faucet(amount: string) {
    return this.enqueue(() =>
      this.faucetRpc.obtainTestTokens(
        new FaucetRequestDto(this.token, this.address, amount, "0.001"),
      ),
    );
  }
}
