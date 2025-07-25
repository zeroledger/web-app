import { EventEmitter } from "node:events";
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
import { CustomClient } from "../core/evmClient.service";

export type EncryptedAccountsStore = Record<
  string,
  {
    authTag: string;
    ciphertext: string;
    iv: string;
    salt: string;
  }
>;

export const AccountServiceEvents = {
  ACCOUNT_SERVICE_CHANGE: "ACCOUNT_SERVICE_CHANGE",
} as const;

export const domain = {
  name: "TES Decryption Delegation",
  version: "0.0.1",
} as const;

// The named list of all type definitions
export const types = {
  Config: [
    { name: "operation", type: "string" },
    { name: "protocol", type: "string" },
    { name: "owner", type: "address" },
    { name: "delegate", type: "address" },
  ],
} as const;

export class AccountService extends EventEmitter {
  private PKS_STORE_KEY: string;

  private _viewPk?: Hash;
  private _viewAccount?: PrivateKeyAccount;
  private _delegationSignature?: Hex;

  constructor(private readonly appPrefixKey: string) {
    super();
    this.PKS_STORE_KEY = `${this.appPrefixKey}.encodedAccountData`;
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

  private encryptedViewPrivateKey(address: Address) {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.view.${address}`,
    ) as Hex | null;
  }

  private encryptedDelegationSignature(address: Address) {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.delegation.${address}`,
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

  async setupViewAccount(password: string, client: CustomClient) {
    const mainAccountAddress = client.account.address;
    const encryptedViewPk = this.encryptedViewPrivateKey(mainAccountAddress);
    const encryptedDelegationSignature =
      this.encryptedDelegationSignature(mainAccountAddress);
    const { pk, pubK } = this.deriveEphemeralEncryptionKeys(password);
    if (encryptedViewPk && encryptedDelegationSignature) {
      this._viewPk = (await decrypt(pk, encryptedViewPk)) as Hash;
      this._viewAccount = privateKeyToAccount(this._viewPk);
      this._delegationSignature = (await decrypt(
        pk,
        encryptedDelegationSignature,
      )) as Hex;
      return;
    }

    this._viewPk = keccak256(
      keccak256(toHex(`${this.appPrefixKey}_${password}`)),
    );
    this._viewAccount = privateKeyToAccount(this._viewPk);
    this._delegationSignature = await client.signTypedData({
      domain,
      types,
      primaryType: "Config",
      message: {
        operation: "delegate decryption",
        protocol: "zeroledger",
        owner: client.account.address,
        delegate: this._viewAccount.address,
      },
    });
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.view.${mainAccountAddress}`,
      await encrypt(this._viewPk, pubK),
    );
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.delegation.${mainAccountAddress}`,
      await encrypt(this._delegationSignature, pubK),
    );
  }

  async reset(mainAccountAddress: Address) {
    delete this._viewAccount;
    delete this._viewPk;
    delete this._delegationSignature;
    localStorage.removeItem(`${this.PKS_STORE_KEY}.view.${mainAccountAddress}`);
    localStorage.removeItem(
      `${this.PKS_STORE_KEY}.delegation.${mainAccountAddress}`,
    );
  }
}
