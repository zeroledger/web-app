import { EventEmitter } from "node:events";
import { type PrivateKeyAccount, type Hex, Hash, keccak256, toHex } from "viem";
import { semiStringToUint8Array } from "@src/utils/common";
import { privateKeyToAccount } from "viem/accounts";
import { decryptData, encryptData } from "@src/utils/crypt";
import { APP_PREFIX_KEY } from "@src/common.constants";

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
    this.PKS_STORE_KEY = `${appPrefixKey}.encodedPKs`;
  }

  private getEncryptedDataJson() {
    return localStorage.getItem(this.PKS_STORE_KEY);
  }

  viewPrivateKey() {
    return this._viewPk;
  }

  getAccount() {
    return this._account;
  }

  getViewAccount() {
    return this._viewAccount;
  }

  getDelegationSignature() {
    return this._delegationSignature;
  }

  isLoggedIn() {
    return this._loggedIn;
  }

  hasAccount() {
    return Object.values(this.encryptedAccounts()).length > 0;
  }

  encryptedAccounts(): EncryptedAccountsStore {
    const encryptedDataJson = this.getEncryptedDataJson();
    if (!encryptedDataJson) {
      return {};
    }
    return JSON.parse(encryptedDataJson) as EncryptedAccountsStore;
  }

  private async create(password: string, privateKey: Hex) {
    this._account = privateKeyToAccount(privateKey);
    const encryption = await encryptData(privateKey, password);

    const encryptedDataJson = JSON.stringify({
      [this._account.address]: {
        authTag: encryption.authTag.toString(),
        ciphertext: encryption.ciphertext.toString(),
        iv: encryption.iv.toString(),
        salt: encryption.salt.toString(),
      },
    });
    localStorage.setItem(this.PKS_STORE_KEY, encryptedDataJson);
    this._loggedIn = true;
  }

  async open(password: string, privateKey?: Hex) {
    const encryptedAccountsList = Object.values(this.encryptedAccounts());
    this._password = password;
    if (privateKey && !encryptedAccountsList.length) {
      this._pk = privateKey;
      await this.create(password, privateKey);
      return;
    }

    const firstEncryptedAccount = encryptedAccountsList[0];

    const encodedPrivateKey = {
      authTag: semiStringToUint8Array(firstEncryptedAccount.authTag),
      ciphertext: semiStringToUint8Array(firstEncryptedAccount.ciphertext),
      iv: semiStringToUint8Array(firstEncryptedAccount.iv),
      salt: semiStringToUint8Array(firstEncryptedAccount.salt),
    };

    this._pk = (await decryptData(encodedPrivateKey, password)) as Hash;
    this._account = privateKeyToAccount(this._pk);

    this._loggedIn = true;
  }

  async setupViewAccount() {
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
    }
  }

  async reset() {
    this._account = undefined;
    localStorage.removeItem(this.PKS_STORE_KEY);
  }
}

export const accountService = new AccountService(APP_PREFIX_KEY);
