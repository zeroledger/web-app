import { EventEmitter } from "node:events";
import { type PrivateKeyAccount, type Hex, Hash, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { APP_PREFIX_KEY } from "@src/common.constants";
import { decrypt, encrypt } from "@zeroledger/vycrypt";

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

  private _account?: PrivateKeyAccount;
  private _password?: string;
  private _loggedIn = false;
  private _pk?: Hash;
  private _viewPk?: Hash;

  private _viewAccount?: PrivateKeyAccount;
  private _delegationSignature?: Hex;

  constructor(appPrefixKey: string) {
    super();
    this.PKS_STORE_KEY = `${appPrefixKey}.encodedAccountData`;
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
   * Main account *
   ****************/

  private encryptedMainPrivateKey() {
    return localStorage.getItem(`${this.PKS_STORE_KEY}.main`) as Hex | null;
  }

  getMainAccount() {
    return this._account;
  }

  isLoggedIn() {
    return this._loggedIn;
  }

  hasMainAccount() {
    return Boolean(this.encryptedMainPrivateKey());
  }

  private async create(password: string, privateKey: Hex) {
    this._account = privateKeyToAccount(privateKey);
    const { pubK } = this.deriveEphemeralEncryptionKeys(password);
    const encryptedMainPublicKey = await encrypt(privateKey, pubK);

    localStorage.setItem(`${this.PKS_STORE_KEY}.main`, encryptedMainPublicKey);
    this._loggedIn = true;
  }

  async open(password: string, privateKey?: Hex) {
    const encryptedMainPk = this.encryptedMainPrivateKey();
    this._password = password;
    if (privateKey && !encryptedMainPk) {
      this._pk = privateKey;
      await this.create(password, privateKey);
      return;
    }

    const { pk } = this.deriveEphemeralEncryptionKeys(password);

    this._pk = (await decrypt(pk, encryptedMainPk!)) as Hash;
    this._account = privateKeyToAccount(this._pk);

    this._loggedIn = true;
  }

  /****************
   * View account *
   ****************/

  private encryptedViewPrivateKey() {
    return localStorage.getItem(`${this.PKS_STORE_KEY}.view`) as Hex | null;
  }

  private encryptedDelegationSignature() {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.delegation`,
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

  async setupViewAccount() {
    const encryptedViewPk = this.encryptedViewPrivateKey();
    const encryptedDelegationSignature = this.encryptedDelegationSignature();
    const { pk, pubK } = this.deriveEphemeralEncryptionKeys(this._password!);
    if (encryptedViewPk && encryptedDelegationSignature) {
      this._viewPk = (await decrypt(pk, encryptedViewPk)) as Hash;
      this._viewAccount = privateKeyToAccount(this._viewPk);
      this._delegationSignature = (await decrypt(
        pk,
        encryptedDelegationSignature,
      )) as Hex;
      return;
    }

    if (this._account && this._password) {
      this._viewPk = keccak256(
        await this._account.sign({
          hash: keccak256(toHex(this._password)),
        }),
      );
      this._viewAccount = privateKeyToAccount(this._viewPk);
      this._delegationSignature = await this._account.signTypedData({
        domain,
        types,
        primaryType: "Config",
        message: {
          operation: "delegate decryption",
          protocol: "zeroledger",
          owner: this._account.address,
          delegate: this._viewAccount.address,
        },
      });
      localStorage.setItem(
        `${this.PKS_STORE_KEY}.view`,
        await encrypt(this._viewPk, pubK),
      );
      localStorage.setItem(
        `${this.PKS_STORE_KEY}.delegation`,
        await encrypt(this._delegationSignature, pubK),
      );
    }
  }

  async reset() {
    delete this._account;
    delete this._viewAccount;
    delete this._password;
    delete this._pk;
    delete this._viewPk;
    delete this._delegationSignature;
    localStorage.removeItem(`${this.PKS_STORE_KEY}.main`);
    localStorage.removeItem(`${this.PKS_STORE_KEY}.view`);
    localStorage.removeItem(`${this.PKS_STORE_KEY}.delegation`);
  }
}

export const accountService = new AccountService(APP_PREFIX_KEY);
