import { Address, parseUnits } from "viem";
import { Logger } from "@src/utils/logger";
import { type Tes } from "@src/services/Tes";
import { EvmClients } from "@src/services/Clients";
import { roundToCents } from "@src/utils/common";

type FeesData = {
  coveredGas: bigint;
  fee: bigint;
  paymasterAddress: Address;
  roundedFee: string;
};

export type DepositFeesData = FeesData & {
  depositFee: bigint;
};

export type WithdrawFeesData = FeesData & {
  withdrawFee: bigint;
};

export type SpendFeesData = FeesData & {
  spendFee: bigint;
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

export class Fees {
  private logger = new Logger(Fees.name);
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
    private readonly tesService: Tes,
  ) {
    this.preloadedModulesPromise = loadHeavyDependencies();
    this.logger.log(`Fees service created with token ${this.token}`);
  }

  async getProtocolFees() {
    const { asyncVaultUtils, asyncProtocolManagerUtils } =
      await this.preloadedModulesPromise;
    return await asyncProtocolManagerUtils.getProtocolFees({
      client: this.evmClients.readClient,
      protocolManager: await asyncVaultUtils.getProtocolManager({
        client: this.evmClients.readClient,
        contract: this.vault,
      }),
      token: this.token,
    });
  }

  async getDepositFeesData(decimals: number): Promise<DepositFeesData> {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    const { deposit: depositFee } = await this.getProtocolFees();
    const coveredGas = asyncVaultUtils.depositGasSponsoredLimit();
    const { fee, paymasterAddress, roundedFee } = await this.getBaseFeesData(
      decimals,
      depositFee,
      coveredGas,
    );

    return {
      coveredGas,
      fee,
      depositFee,
      paymasterAddress,
      roundedFee,
    };
  }

  async getWithdrawFeesData(
    decimals: number,
    withdrawingItemsAmount: number,
  ): Promise<WithdrawFeesData> {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    const { withdraw: withdrawFee } = await this.getProtocolFees();
    const coveredGas = asyncVaultUtils.withdrawGasSponsoredLimit(
      withdrawingItemsAmount,
    );
    const { fee, paymasterAddress, roundedFee } = await this.getBaseFeesData(
      decimals,
      withdrawFee,
      coveredGas,
    );
    return {
      coveredGas,
      fee,
      withdrawFee,
      paymasterAddress,
      roundedFee,
    };
  }

  async getSpendFeesData(decimals: number): Promise<SpendFeesData> {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    const coveredGas = asyncVaultUtils.spendGasSponsoredLimit(1, 3, 2);
    const { spend: spendFee } = await this.getProtocolFees();
    const { fee, paymasterAddress, roundedFee } = await this.getBaseFeesData(
      decimals,
      spendFee,
      coveredGas,
    );
    return {
      coveredGas,
      fee,
      spendFee,
      paymasterAddress,
      roundedFee,
    };
  }

  private async getBaseFeesData(
    decimals: number,
    protocolFees: bigint,
    coveredGas: bigint,
  ) {
    const { gasPrice, paymasterAddress } = await this.tesService.quote(
      this.token,
      (await this.evmClients.externalClient()).account.address,
    );

    const draftFee = coveredGas * gasPrice;
    const roundedFee = roundToCents(draftFee + protocolFees, decimals);
    const fee = parseUnits(roundedFee, decimals) - protocolFees;

    return {
      coveredGas,
      fee,
      paymasterAddress,
      roundedFee,
    };
  }
}
