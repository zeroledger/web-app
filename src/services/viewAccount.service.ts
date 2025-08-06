import {
  type PrivateKeyAccount,
  type Hex,
  Hash,
  keccak256,
  toHex,
  Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { decrypt, encrypt } from "@zeroledger/vycrypt";
import { EvmClientService } from "@src/services/core/evmClient.service";

export type EncryptedAccountsStore = Record<
  string,
  {
    authTag: string;
    ciphertext: string;
    iv: string;
    salt: string;
  }
>;

const domain = {
  name: "View Account Authorization",
  version: "0.0.1",
} as const;

// The named list of all type definitions
const types = {
  Authorize: [
    { name: "protocol", type: "string" },
    { name: "main_account", type: "address" },
    { name: "view_account", type: "address" },
  ],
} as const;

export class ViewAccountService {
  private PKS_STORE_KEY: string;

  private _viewPk?: Hash;
  private _viewAccount?: PrivateKeyAccount;
  private _delegationSignature?: Hex;
  private _mainAccountAddress: Address;

  constructor(
    private readonly appPrefixKey: string,
    private readonly password: string,
    private readonly evmClientService: EvmClientService,
  ) {
    this.PKS_STORE_KEY = `${this.appPrefixKey}.encodedAccountData`;
    this._mainAccountAddress =
      this.evmClientService.writeClient!.account.address;
  }

  /*********
   * Utils *
   *********/

  private deriveEphemeralEncryptionKeys(password: string) {
    const pk = keccak256(toHex(password));
    const pubK = privateKeyToAccount(pk).publicKey;
    return { pk, pubK };
  }

  /****************
   * View account *
   ****************/

  private encryptedViewPrivateKey() {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.view.${this._mainAccountAddress}`,
    ) as Hex | null;
  }

  private encryptedDelegationSignature() {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.delegation.${this._mainAccountAddress}`,
    ) as Hex | null;
  }

  viewPrivateKey() {
    return this._viewPk;
  }

  getViewAccount() {
    return this._viewAccount;
  }

  getDelegationSignature() {
    return this._delegationSignature;
  }

  hasEncryptedViewAccount() {
    return (
      this.encryptedViewPrivateKey() && this.encryptedDelegationSignature()
    );
  }

  async unlockViewAccount() {
    const encryptedViewPk = this.encryptedViewPrivateKey();
    const encryptedDelegationSignature = this.encryptedDelegationSignature();
    const { pk } = this.deriveEphemeralEncryptionKeys(this.password);
    this._viewPk = (await decrypt(pk, encryptedViewPk!)) as Hash;
    this._viewAccount = privateKeyToAccount(this._viewPk);
    this._delegationSignature = (await decrypt(
      pk,
      encryptedDelegationSignature!,
    )) as Hex;
  }

  prepareViewAccount() {
    this._viewPk = keccak256(
      keccak256(
        toHex(
          `${this.appPrefixKey}_${this.password}_${this._mainAccountAddress}`,
        ),
      ),
    );
    this._viewAccount = privateKeyToAccount(this._viewPk);
  }

  async authorize() {
    const { pubK } = this.deriveEphemeralEncryptionKeys(this.password);
    this._delegationSignature =
      await this.evmClientService.writeClient!.signTypedData({
        domain,
        types,
        primaryType: "Authorize",
        message: {
          protocol: "zeroledger",
          main_account: this._mainAccountAddress,
          view_account: this._viewAccount!.address,
        },
      });
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.view.${this._mainAccountAddress}`,
      await encrypt(this._viewPk!, pubK),
    );
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.delegation.${this._mainAccountAddress}`,
      await encrypt(this._delegationSignature, pubK),
    );
  }

  reset() {
    delete this._viewAccount;
    delete this._viewPk;
    delete this._delegationSignature;
    localStorage.removeItem(
      `${this.PKS_STORE_KEY}.view.${this._mainAccountAddress}`,
    );
    localStorage.removeItem(
      `${this.PKS_STORE_KEY}.delegation.${this._mainAccountAddress}`,
    );
  }
}
