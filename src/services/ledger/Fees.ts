import {
  type Address,
  formatUnits,
  isErc6492Signature,
  parseUnits,
} from "viem";
import { Logger } from "@src/utils/logger";
import { type Tes } from "@src/services/Tes";
import { type EvmClients } from "@src/services/Clients";
import { roundToCents } from "@src/utils/common";
import { permitSupported } from "@src/utils/erc20";

type FeesData = {
  coveredGas: bigint;
  fee: bigint;
  paymasterAddress: Address;
  roundedFee: string;
};

export type DepositFeesData = FeesData & {
  depositFee: bigint;
  withPermit: boolean;
  smartWalletAndRequireInitialization: boolean;
};

export type WithdrawFeesData = FeesData & {
  withdrawFee: bigint;
  smartWalletAndRequireInitialization: boolean;
};

export type SpendFeesData = FeesData & {
  spendFee: bigint;
  smartWalletAndRequireInitialization: boolean;
};

// Dynamic imports for heavy dependencies
const loadHeavyDependencies = async () => {
  const [asyncVaultUtils, asyncProtocolManagerUtils] = await Promise.all([
    import("@src/utils/vault"),
    import("@src/utils/protocolManager"),
  ]);

  return {
    asyncVaultUtils,
    asyncProtocolManagerUtils,
  };
};

export class Fees {
  private logger = new Logger(Fees.name);
  private preloadedModulesPromise = loadHeavyDependencies();
  constructor(
    private readonly evmClients: EvmClients,
    private readonly vault: Address,
    private readonly token: Address,
    private readonly tesService: Tes,
    private readonly walletAddress: Address,
  ) {
    this.logger.log(`Fees service created with token ${this.token}`);
  }

  async walletParams() {
    const delegationSig = this.tesService.viewAccount.getDelegationSignature();

    const authWasErc6492Signature =
      !!delegationSig && isErc6492Signature(delegationSig);
    const bytecode = Boolean(
      await this.evmClients.readClient.getCode({
        address: this.walletAddress,
      }),
    );

    return {
      smartWalletAndRequireInitialization: bytecode && authWasErc6492Signature,
      isEOA: !bytecode && !authWasErc6492Signature,
      smartWallet: !!bytecode,
    };
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
    const tokenWithPermit = await permitSupported(
      this.token,
      await this.evmClients.externalClient(),
    );

    const { isEOA, smartWalletAndRequireInitialization } =
      await this.walletParams();
    const withPermit = isEOA && tokenWithPermit;
    const gasLimit = withPermit
      ? asyncVaultUtils.depositGasSponsoredLimit()
      : asyncVaultUtils.depositWithPermitGasSponsoredLimit(
          smartWalletAndRequireInitialization,
        );
    const { fee, paymasterAddress, roundedFee, coveredGas } =
      await this.getBaseFeesData(decimals, depositFee, gasLimit, "deposit");

    return {
      coveredGas,
      fee,
      depositFee,
      paymasterAddress,
      roundedFee,
      withPermit,
      smartWalletAndRequireInitialization,
    };
  }

  async getWithdrawFeesData(
    decimals: number,
    withdrawingItemsAmount: number,
  ): Promise<WithdrawFeesData> {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    const { withdraw: withdrawFee } = await this.getProtocolFees();
    const { smartWalletAndRequireInitialization } = await this.walletParams();
    const { fee, paymasterAddress, roundedFee, coveredGas } =
      await this.getBaseFeesData(
        decimals,
        withdrawFee,
        asyncVaultUtils.withdrawGasSponsoredLimit(
          withdrawingItemsAmount,
          smartWalletAndRequireInitialization,
        ),
        "withdraw",
      );

    return {
      coveredGas,
      fee,
      withdrawFee,
      paymasterAddress,
      roundedFee,
      smartWalletAndRequireInitialization,
    };
  }

  async getSpendFeesData(decimals: number): Promise<SpendFeesData> {
    const { asyncVaultUtils } = await this.preloadedModulesPromise;
    const { spend: spendFee } = await this.getProtocolFees();
    const { smartWalletAndRequireInitialization } = await this.walletParams();

    const { fee, paymasterAddress, roundedFee, coveredGas } =
      await this.getBaseFeesData(
        decimals,
        spendFee,
        asyncVaultUtils.spendGasSponsoredLimit(
          1,
          3,
          2,
          smartWalletAndRequireInitialization,
        ),
        "spend",
      );

    return {
      coveredGas,
      fee,
      spendFee,
      paymasterAddress,
      roundedFee,
      smartWalletAndRequireInitialization,
    };
  }

  private async getBaseFeesData(
    decimals: number,
    protocolFees: bigint,
    gasToCover: bigint,
    method: "deposit" | "withdraw" | "spend",
  ) {
    const { gasPrice, paymasterAddress, sponsoredVaultMethods } =
      await this.tesService.quote(
        this.token,
        (await this.evmClients.externalClient()).account.address,
      );

    if (!sponsoredVaultMethods.includes(method)) {
      const draftFee = gasToCover * gasPrice;
      const roundedFee = roundToCents(draftFee + protocolFees, decimals);
      const fee = parseUnits(roundedFee, decimals) - protocolFees;

      return {
        coveredGas: fee / gasPrice,
        fee,
        paymasterAddress,
        roundedFee,
      };
    } else {
      return {
        coveredGas: gasToCover,
        fee: 0n,
        paymasterAddress,
        roundedFee: formatUnits(protocolFees, decimals),
      };
    }
  }
}
