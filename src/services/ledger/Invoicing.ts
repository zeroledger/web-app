import { Address } from "viem";
import { Logger } from "@src/utils/logger";
import type { MemoryQueue } from "@src/services/core/queue";
import { catchService } from "@src/services/core/catch.service";
import { type Tes } from "@src/services/Tes";
import type { EvmClients } from "@src/services/Clients";
import type { DepositFeesData } from "./Fees";

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
    asyncInvoiceUtils,
    { Tes },
    asyncProtocolManagerUtils,
  ] = await Promise.all([
    import("@src/utils/vault"),
    import("@src/utils/invoice"),
    import("@src/services/Tes"),
    import("@src/utils/protocolManager"),
  ]);

  return {
    asyncVaultUtils,
    asyncInvoiceUtils,
    Tes,
    asyncProtocolManagerUtils,
  };
};

export class Invoicing {
  private logger = new Logger(Invoicing.name);
  private catchService = catchService;
  private preloadedModulesPromise: Promise<{
    asyncVaultUtils: typeof import("@src/utils/vault");
    asyncInvoiceUtils: typeof import("@src/utils/invoice");
    Tes: typeof import("@src/services/Tes").Tes;
    asyncProtocolManagerUtils: typeof import("@src/utils/protocolManager");
  }>;
  constructor(
    private readonly evmClients: EvmClients,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly invoiceFactory: Address,
    private readonly queue: MemoryQueue,
    private readonly tesService: Tes,
  ) {
    this.preloadedModulesPromise = loadHeavyDependencies();
    this.logger.log(`Invoicing service created with token ${this.token}`);
  }

  mainAccount() {
    return this.evmClients.externalClient().account;
  }

  private async enqueue<T>(
    fn: () => Promise<T>,
    correlationId?: string,
    timeout?: number,
    forwardError?: boolean,
  ) {
    const [err, result] = await this.queue.schedule(
      Invoicing.name,
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
    const mainAccount = this.mainAccount();
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

  generateInvoice(amount: bigint, message: string, feesData: DepositFeesData) {
    return this.enqueue(
      async () => {
        const { asyncVaultUtils, asyncInvoiceUtils } =
          await this.preloadedModulesPromise;
        const mainAccount = this.mainAccount();
        const { tesUrl, encryptionPublicKey } = await this.getEncryptionParams(
          mainAccount.address,
        );

        const { proofData, depositStruct /* depositCommitmentData */ } =
          await asyncVaultUtils.prepareDeposit(
            this.token,
            mainAccount.address,
            // since fee is paid at invoice execution time,
            // we need to subtract it from the amount before depositStruct creation
            amount - feesData.fee,
            encryptionPublicKey,
            feesData.depositFee,
            // fee is paid at invoice execution time, so we need to set it to 0
            0n,
            feesData.paymasterAddress,
            tesUrl,
            message,
          );

        const invoiceAddress = await asyncInvoiceUtils.predictInvoiceAddress({
          vault: this.vault,
          token: this.token,
          amount,
          executionFee: feesData.fee,
          commitmentParams: depositStruct.depositCommitmentParams,
          client: this.evmClients.readClient,
          invoiceFactory: this.invoiceFactory,
          paymaster: feesData.paymasterAddress,
        });

        await this.tesService.registerInvoice(
          invoiceAddress,
          this.vault,
          this.token,
          amount,
          feesData.fee,
          depositStruct.depositCommitmentParams,
          proofData.calldata_proof,
          mainAccount.address,
        );

        // todo: extend activity to support invoice issuance

        return {
          invoiceAddress,
        };
      },
      "generateInvoice",
      30_000,
      true,
    );
  }
}
