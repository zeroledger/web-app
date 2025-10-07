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
import { type EvmClients } from "@src/services/Clients";

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

export class ViewAccount {
  private PKS_STORE_KEY: string;

  private _viewPk?: Hash;
  private _viewAccount?: PrivateKeyAccount;
  private _delegationSignature?: Hex;

  constructor(private readonly appPrefixKey: string) {
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

  private encryptedViewPrivateKey(mainAccountAddress: Address) {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.view.${mainAccountAddress}`,
    ) as Hex | null;
  }

  private encryptedDelegationSignature(mainAccountAddress: Address) {
    return localStorage.getItem(
      `${this.PKS_STORE_KEY}.delegation.${mainAccountAddress}`,
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

  hasEncryptedViewAccount(mainAccountAddress: Address) {
    return (
      this.encryptedViewPrivateKey(mainAccountAddress) &&
      this.encryptedDelegationSignature(mainAccountAddress)
    );
  }

  async unlockViewAccount(mainAccountAddress: Address, password: string) {
    const encryptedViewPk = this.encryptedViewPrivateKey(mainAccountAddress);
    const encryptedDelegationSignature =
      this.encryptedDelegationSignature(mainAccountAddress);
    const { pk } = this.deriveEphemeralEncryptionKeys(password);
    this._viewPk = (await decrypt(pk, encryptedViewPk!)) as Hash;
    this._viewAccount = privateKeyToAccount(this._viewPk);
    this._delegationSignature = (await decrypt(
      pk,
      encryptedDelegationSignature!,
    )) as Hex;
  }

  prepareViewAccount(mainAccountAddress: Address, password: string) {
    this._viewPk = keccak256(
      keccak256(toHex(`zeroledger_${password}_${mainAccountAddress}`)),
    );
    this._viewAccount = privateKeyToAccount(this._viewPk);
  }

  async authorize(evmClients: EvmClients, password: string) {
    const { pubK } = this.deriveEphemeralEncryptionKeys(password);
    const externalClient = await evmClients.externalClient();
    this._delegationSignature = await externalClient.signTypedData({
      domain,
      types,
      primaryType: "Authorize",
      message: {
        protocol: "zeroledger",
        main_account: externalClient.account.address,
        view_account: this._viewAccount!.address,
      },
    });
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.view.${externalClient.account.address}`,
      await encrypt(this._viewPk!, pubK),
    );
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.delegation.${externalClient.account.address}`,
      await encrypt(this._delegationSignature, pubK),
    );
  }

  reset(mainAccountAddress: Address) {
    delete this._viewAccount;
    delete this._viewPk;
    delete this._delegationSignature;
    localStorage.removeItem(`${this.PKS_STORE_KEY}.view.${mainAccountAddress}`);
    localStorage.removeItem(
      `${this.PKS_STORE_KEY}.delegation.${mainAccountAddress}`,
    );
  }
}
