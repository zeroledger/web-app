import { EventEmitter } from "node:events";
import {
  type PrivateKeyAccount,
  type Hex,
  type Address,
  Hash,
  zeroHash,
} from "viem";
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

export class AccountService extends EventEmitter {
  private PKS_STORE_KEY: string;

  private _account: PrivateKeyAccount | undefined;
  private _memoizedPassword: string | undefined;
  private _loggedIn = false;
  private _pk: Hash;

  constructor(appPrefixKey: string) {
    super();
    this.PKS_STORE_KEY = `${appPrefixKey}.encodedPKs`;
    this._pk = zeroHash;
  }

  private getEncryptedDataJson() {
    return localStorage.getItem(this.PKS_STORE_KEY);
  }

  decryptPrivateKey() {
    return this._pk;
  }

  getAccount() {
    return this._account;
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
    this._memoizedPassword = password;
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

  async reset() {
    this._account = undefined;
    this._memoizedPassword = undefined;
    localStorage.removeItem(this.PKS_STORE_KEY);
  }

  async changeAccount(changedAccount: Address) {
    const encryptedDataJson = this.getEncryptedDataJson();
    if (!encryptedDataJson) {
      return;
    }
    const accountsStore: EncryptedAccountsStore = JSON.parse(encryptedDataJson);
    const { authTag, ciphertext, iv, salt } = accountsStore[changedAccount];

    const encodedPrivateKey = {
      authTag: semiStringToUint8Array(authTag),
      ciphertext: semiStringToUint8Array(ciphertext),
      iv: semiStringToUint8Array(iv),
      salt: semiStringToUint8Array(salt),
    };

    const pk = (await decryptData(
      encodedPrivateKey,
      this._memoizedPassword!,
    )) as Hash;
    this._account = privateKeyToAccount(pk);
    this.emit(AccountServiceEvents.ACCOUNT_SERVICE_CHANGE, this._account);
  }
}

export const accountService = new AccountService(APP_PREFIX_KEY);
