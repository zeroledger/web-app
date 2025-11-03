import {
  type PrivateKeyAccount,
  type Hex,
  Hash,
  keccak256,
  Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { decrypt, encrypt } from "@zeroledger/vycrypt";
import { type CustomClient } from "@src/services/Clients";
import { signTypedData } from "@src/utils/signTypedData";

export type EncryptedAccountsStore = Record<
  string,
  {
    authTag: string;
    ciphertext: string;
    iv: string;
    salt: string;
  }
>;

const authorizationDomain = {
  name: "View Account Authorization",
  version: "0.0.1",
} as const;

const authorizationTypes = {
  Authorize: [
    { name: "protocol", type: "string" },
    { name: "main_account", type: "address" },
    { name: "view_account", type: "address" },
  ],
} as const;

const viewAccountCreationDomain = {
  name: "View Account Creation",
  version: "0.0.1",
} as const;

const viewAccountCreationTypes = {
  Create: [
    { name: "primaryWalletAddress", type: "address" },
    { name: "protocol", type: "string" },
    { name: "vaultAddress", type: "address" },
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

  /****************
   * View account *
   ****************/

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

  hasAuthorization(mainAccountAddress: Address) {
    return !!this.encryptedDelegationSignature(mainAccountAddress);
  }

  async createFromSignature(signature: Hex) {
    this._viewPk = keccak256(signature);
    this._viewAccount = privateKeyToAccount(this._viewPk);
  }

  async signViewAccountCreation(
    embeddedClient: CustomClient,
    primaryWalletAddress: Address,
    vaultAddress: Address,
  ): Promise<Hex> {
    const obj = {
      domain: viewAccountCreationDomain,
      types: viewAccountCreationTypes,
      primaryType: "Create" as const,
      message: {
        primaryWalletAddress,
        protocol: "zeroledger",
        vaultAddress,
      },
    };
    return await signTypedData(embeddedClient, obj);
  }

  async loadAuthorization(mainAccountAddress: Address) {
    const encryptedDelegationSignature =
      this.encryptedDelegationSignature(mainAccountAddress);

    if (!encryptedDelegationSignature || !this._viewPk) {
      throw new Error("No authorization found or ViewAccount not initialized");
    }
    this._delegationSignature = (await decrypt(
      this._viewPk,
      encryptedDelegationSignature,
    )) as Hex;
  }

  async authorize(primaryClient: CustomClient) {
    if (!this._viewPk || !this._viewAccount) {
      throw new Error("ViewAccount not initialized");
    }

    const pubK = privateKeyToAccount(this._viewPk).publicKey;
    const obj = {
      domain: authorizationDomain,
      types: authorizationTypes,
      primaryType: "Authorize" as const,
      message: {
        protocol: "zeroledger",
        main_account: primaryClient.account.address,
        view_account: this._viewAccount.address,
      },
    };
    this._delegationSignature = await signTypedData(primaryClient, obj);
    localStorage.setItem(
      `${this.PKS_STORE_KEY}.delegation.${primaryClient.account.address}`,
      await encrypt(this._delegationSignature, pubK),
    );
  }

  reset(mainAccountAddress: Address) {
    delete this._viewAccount;
    delete this._viewPk;
    delete this._delegationSignature;
    localStorage.removeItem(
      `${this.PKS_STORE_KEY}.delegation.${mainAccountAddress}`,
    );
  }
}
