import {
  type PrivateKeyAccount,
  type Hex,
  Hash,
  keccak256,
  Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  decrypt,
  encrypt,
  generateQuantumKeyPair,
  QuantumKeyPair,
} from "@zeroledger/vycrypt";
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
  name: "Authorization",
  version: "0.0.1",
} as const;

const authorizationTypes = {
  Authorize: [
    { name: "protocol", type: "string" },
    { name: "main_account", type: "address" },
    { name: "auth_account", type: "address" },
    { name: "encryption_key", type: "bytes" },
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
  private _quantumKeyPair?: QuantumKeyPair;

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

  getQuantumKeyPair() {
    return this._quantumKeyPair;
  }

  hasAuthorization(mainAccountAddress: Address) {
    return !!this.encryptedDelegationSignature(mainAccountAddress);
  }

  createFromSignature(signature: Hex) {
    this._viewPk = keccak256(signature);
    this._viewAccount = privateKeyToAccount(this._viewPk);
    this._quantumKeyPair = generateQuantumKeyPair(keccak256(this._viewPk));
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
    this._delegationSignature = decrypt(
      this._viewPk,
      encryptedDelegationSignature,
    ) as Hex;
  }

  async authorize(primaryClient: CustomClient) {
    if (!this._viewPk || !this._viewAccount || !this._quantumKeyPair) {
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
        auth_account: this._viewAccount.address,
        encryption_key: this._quantumKeyPair.publicKey,
      },
    };
    this._delegationSignature = await signTypedData(primaryClient, obj);
    const isValid = await primaryClient.verifyTypedData({
      address: primaryClient.account.address,
      domain: obj.domain,
      types: obj.types,
      primaryType: obj.primaryType,
      message: obj.message,
      signature: this._delegationSignature,
    });
    console.log(`signature valid?: ${isValid}`);
    if (isValid) {
      localStorage.setItem(
        `${this.PKS_STORE_KEY}.delegation.${primaryClient.account.address}`,
        encrypt(this._delegationSignature, pubK),
      );
    } else {
      throw new Error("Delegation signature is not valid");
    }
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
